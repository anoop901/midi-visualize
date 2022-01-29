import React, { useCallback, useEffect, useReducer, useState } from "react";
import "./App.css";
import { v4 as uuidv4 } from "uuid";
import openSocket from "socket.io-client";
import update from "immutability-helper";
import classnames from "classnames";

/*
a history entry looks like this:
{
  index: <Number>
  startTime: <Number>
  velocity: <Number>
  ended: <boolean>
  endTime: <Number> (present if ended is true)
}
*/

const socket = openSocket();

const tickDuration = 20;
const cleanupDuration = 1000;
const pixelsPerMs = 0.1;
const startY = 300;
const endY = 0;
const maxSinceEnded = (startY - endY) / pixelsPerMs;
const numKeys = 88;
const midiKeyOffset = 21;

const whiteKeys = [0, 2, 3, 5, 7, 8, 10];
// const whiteKeys = [0, 2, 4, 5, 7, 9, 11];
const whiteKeysIndexOf = [0, null, 1, 2, null, 3, null, 4, 5, null, 6, null];

function isWhiteKey(index) {
  return whiteKeys.indexOf(index % 12) >= 0;
}

function ensureNotNegative(x) {
  return x < 0 ? 0 : x;
}

const pr = new Intl.PluralRules("en-US", { type: "ordinal" });
const suffixes = new Map([
  ["one", "st"],
  ["two", "nd"],
  ["few", "rd"],
  ["other", "th"],
]);
function formatOrdinal(n) {
  const rule = pr.select(n);
  const suffix = suffixes.get(rule);
  return `${n}${suffix}`;
}

// sharps: F C G D A E B
// flats:  B E A D G C F

const noteNames = [
  "A",
  "B♭",
  "B",
  "C",
  "C♯",
  "D",
  "E♭",
  "E",
  "F",
  "F♯",
  "G",
  "G♯",
];

function indexToName(index) {
  return noteNames[index % 12];
  //return ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "G♯", "A", "B♭", "B"][index % 12];
}

function generateInitialNoteCounts() {
  const ret = {};
  for (const noteName of noteNames) {
    ret[noteName] = 0;
  }
  return ret;
}

function App() {
  const [pressedKeys, setPressedKeys] = useState(Array(numKeys).fill(false));
  const [history, updateHistory] = useReducer(update, []);
  const [now, setNow] = useState(performance.now());
  const [showNoteCounts, setShowNoteCounts] = useState(false);
  const [showNoteRanks, setShowNoteRanks] = useState(false);

  const initialNoteCounts = useCallback(generateInitialNoteCounts, [])();
  const [noteCounts, updateNoteCounts] = useReducer(update, initialNoteCounts);

  function updateNowToPresent() {
    setNow(performance.now());
  }

  function cleanupHistory() {
    const now = performance.now();
    updateHistory({
      $apply: (history) =>
        history.filter(
          (entry) => !entry.ended || now - entry.endTime < maxSinceEnded
        ),
    });
  }

  useEffect(() => {
    socket.on("noteon", (msg) => {
      const index = msg.note_number - midiKeyOffset;
      setPressedKeys(pressedKeys.map((v, i) => (i === index ? true : v)));
      updateHistory({
        $push: [
          {
            index: index,
            velocity: msg.note_velocity / 64,
            startTime: performance.now(),
            ended: false,
            id: uuidv4(),
          },
        ],
      });
      updateNoteCounts({ [indexToName(index)]: { $apply: (x) => x + 1 } });
    });

    socket.on("noteoff", (msg) => {
      const index = msg.note_number - midiKeyOffset;

      setPressedKeys(
        pressedKeys.map((v, i) =>
          i + midiKeyOffset === msg.note_number ? false : v
        )
      );
      updateHistory({
        $apply: (history) =>
          history.map((entry) =>
            entry.index === index && !entry.ended
              ? {
                  index: entry.index,
                  velocity: entry.velocity,
                  startTime: entry.startTime,
                  ended: true,
                  endTime: performance.now(),
                  id: entry.id,
                }
              : entry
          ),
      });
    });
    window.setInterval(() => updateNowToPresent(), tickDuration);
    window.setInterval(() => cleanupHistory(), cleanupDuration);
  }, []);

  return (
    <>
      <svg viewBox="0 0 624 350">
        {/* Group of white keys */}
        <g>
          {Array(numKeys)
            .fill()
            .map((v, i) =>
              isWhiteKey(i) ? (
                <rect
                  key={i}
                  x={84 * Math.floor(i / 12) + 12 * whiteKeysIndexOf[i % 12]}
                  y="300"
                  width="12"
                  height="50"
                  stroke="black"
                  fill={pressedKeys[i] ? "red" : "white"}
                />
              ) : null
            )}
        </g>
        {/* Group of black keys */}
        <g>
          {Array(numKeys)
            .fill()
            .map((v, i) =>
              !isWhiteKey(i) ? (
                <rect
                  key={i}
                  x={3 + 7 * i}
                  y="300"
                  width="7"
                  height="30"
                  stroke="black"
                  fill={pressedKeys[i] ? "red" : "black"}
                />
              ) : null
            )}
        </g>
        <g>
          {history.map((entry) => (
            <g opacity={entry.velocity} key={entry.id}>
              <rect
                x={3 + 7 * entry.index}
                y={startY - pixelsPerMs * (now - entry.startTime)}
                width="7"
                height={ensureNotNegative(
                  entry.ended
                    ? pixelsPerMs * (entry.endTime - entry.startTime)
                    : pixelsPerMs * (now - entry.startTime)
                )}
                fill={`hsl(${30 * entry.index - 90},75%,50%)`}
              />

              <circle
                cx={6.5 + 7 * entry.index}
                cy={startY - pixelsPerMs * (now - entry.startTime)}
                r={12}
                fill={`hsl(${30 * entry.index - 90},75%,75%)`}
                stroke={`hsl(${30 * entry.index - 90},75%,50%)`}
                strokeWidth="2"
              />
              <text
                x={6.5 + 7 * entry.index}
                y={startY - pixelsPerMs * (now - entry.startTime)}
                textAnchor="middle"
                alignmentBaseline="middle"
                fill="black"
                fontWeight="bold"
              >
                {indexToName(entry.index)}
              </text>
            </g>
          ))}
        </g>
      </svg>
      <div
        className={classnames("hiding-panel", { pinned: showNoteCounts })}
        style={{
          position: "absolute",
          right: 10,
          top: 10,
          padding: 10,
          background: "#0008",
          color: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div className="controls">
          <input
            type="checkbox"
            id="showNoteCounts"
            value={showNoteCounts}
            onChange={(e) => {
              setShowNoteCounts(e.currentTarget.checked);
            }}
          />
          <label htmlFor="showNoteCounts">Show note counts</label>
        </div>
        {showNoteCounts && (
          <div className="controls">
            <input
              type="checkbox"
              id="showNoteRanks"
              value={showNoteRanks}
              onChange={(e) => {
                setShowNoteRanks(e.currentTarget.checked);
              }}
            />
            <label htmlFor="showNoteRanks">Show ranks</label>
          </div>
        )}
        {showNoteCounts && (
          <button
            className="controls"
            onClick={(e) => {
              updateNoteCounts({ $set: initialNoteCounts });
            }}
          >
            Reset
          </button>
        )}
        {showNoteCounts && (
          <div>
            <table
              style={{
                fontSize: 30,
                textAlign: "center",
              }}
            >
              <tbody>
                {Object.entries(noteCounts).map(([noteName, count], i) => {
                  const rank =
                    Object.values(noteCounts).filter((x) => x > count).length +
                    1;
                  return (
                    <tr key={i}>
                      <th>{noteName}</th>
                      <td>{count}</td>
                      {showNoteRanks && (
                        <td style={{ fontSize: 15 }}>{formatOrdinal(rank)}</td>
                      )}
                      {showNoteRanks && (
                        <td>
                          {rank === 1
                            ? "🥇"
                            : rank === 2
                            ? "🥈"
                            : rank === 3
                            ? "🥉"
                            : null}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
