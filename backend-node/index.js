var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var midi = require('midi');

app.use(express.static('../frontend/build'));

http.listen(3000, function() {
	console.log('listening on *:3000');
});

var midi_input = new midi.input();
var num_midi_inputs = midi_input.getPortCount();
console.log(num_midi_inputs);
for (i = 0; i < num_midi_inputs; i++) {
	midi_input.openPort(i);
}

midi_input.on('message', function(deltaTime, message) {
	var statusByte = message[0];
	var dataByte1 = message[1];
	var dataByte2 = message[2];

	console.log(message);

	if (statusByte === 0x80) {
		console.log('off');
		io.emit('noteoff', {note_number: dataByte1, note_velocity: dataByte2});
	} else if (statusByte === 0x90) {
		console.log('on');
		io.emit('noteon', {note_number: dataByte1, note_velocity: dataByte2});
	}
});

/*
setInterval(function () {
	var note_number = Math.floor(60 + 24 * Math.random())
	io.emit('noteon', {note_number: note_number, note_velocity: 100});
	setTimeout(function () {
		io.emit('noteoff', {note_number: note_number, note_velocity: 100})
	}, Math.random() * 500);
}, 100);
*/
