var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var midi = require("midi");

app.use(express.static("../frontend/build"));

http.listen(3000, function () {
  console.log("listening on *:3000");
});

var num_midi_inputs = new midi.Input().getPortCount();
console.log(`found ${num_midi_inputs} midi inputs`);
for (i = 0; i < num_midi_inputs; i++) {
  var midi_input = new midi.Input();
  console.log(`[${i}] ${midi_input.getPortName(i)}`);
  midi_input.openPort(i);
  midi_input.on("message", function (deltaTime, message) {
    var statusByte = message[0];
    var dataByte1 = message[1];
    var dataByte2 = message[2];
    if (statusByte === 0x80) {
      io.emit("noteoff", { note_number: dataByte1, note_velocity: dataByte2 });
    } else if (statusByte === 0x90) {
      io.emit("noteon", { note_number: dataByte1, note_velocity: dataByte2 });
    }
  });
}
