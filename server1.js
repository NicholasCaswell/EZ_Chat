
//make two more chat rooms, same backend. 

var http = require('http'); //http server
var path = require('path'); //to use file paths

var async = require('async'); //for asyncrhonous data/traffic
var socketio = require('socket.io'); //tcp connection
var express = require('express'); //easier to serve static files, some cases dynamic. 

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

/*var express = require('express');
var app     = express();
var server  = app.listen(1337);
var io      = require('socket.io').listen(server);*/

router.use(express.static('client/index1'));
var messages = [];
var sockets = [];

io.on('connection', function (socket) {
    messages.forEach(function (data) {
      socket.emit('message', data);
    });

    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();
    });

    socket.on('message', function (msg) {
      var text = String(msg || '');
      //TODO: Make swear parser, to weed out profanity
      if (!text)
        return;

      socket.get('name', function (err, name) {
        var data = {
          name: name,
          text: text
        };
      if (err) throw err;
        broadcast('message', data);
        messages.push(data);
      });
    });

    socket.on('identify', function (name) {
      socket.set('name', String(name || 'Anonymous'), function (err) {
        updateRoster();
        if (err) throw err;
      });
    });
  });

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
      if (err) throw err;
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

server.listen(8081 || 3001, process.env.IP || "0.0.0.1", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
