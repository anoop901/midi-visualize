import { useEffect, useState } from "react";
import "./Queue.css";
import { io } from "socket.io-client";

const requesters = (queueEntry) =>
  queueEntry.requests.map((r) => r.name).join(", ");

export const Queue = () => {
  const [queue, setQueue] = useState([]);

  const currentRequest = queue[0] || null;
  const futureRequests = queue.slice(1);

  useEffect(() => {
    const intervalHandle = setInterval(() => {
      fetch("https://api.streamersonglist.com/v1/streamers/378/queue")
        .then((res) => {
          return res.json();
        })
        .then((resJson) => {
          setQueue(resJson.list);
        });
    }, 5000);

    return () => {
      clearInterval(intervalHandle);
    };
  }, []);

  return (
    currentRequest && (
      <div className="Queue">
        <div>
          <div className="header">Currently playing</div>
          <div className="current title">{currentRequest.song.title}</div>
          <div className="current composer-full">
            by{" "}
            <span className="current composer">
              {currentRequest.song.artist}
            </span>
          </div>
          <div className="requester-full">
            requested by{" "}
            <span className="current requester">
              {requesters(currentRequest)}
            </span>
          </div>
        </div>

        {futureRequests && futureRequests.length > 0 && (
          <>
            <hr />
            <div>
              <div className="header">Up next</div>
              {futureRequests.map((queueEntry) => (
                <div key={queueEntry.id}>
                  <span className="nextup requester-full">
                    <span className="nextup requester">
                      {requesters(queueEntry)}
                    </span>{" "}
                    requested:{" "}
                  </span>
                  <span className="nextup title">{queueEntry.song.title}</span>{" "}
                  by{" "}
                  <span className="nextup composer">
                    {queueEntry.song.artist}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )
  );
};
