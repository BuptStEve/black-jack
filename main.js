/*
* @Author: BuptStEve
* @Date:   2016-04-08 21:19:39
* @Last Modified by:   BuptStEve
* @Last Modified time: 2016-04-12 16:06:04
*/

var express = require('express'),
    app     = express(),
    http    = require('http').Server(app),
    io      = require('socket.io')(http),
    Deck    = require('./deck'),
    game    = new Deck().init();

app.use('/img', express.static(__dirname + '/img'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  io.emit('status', JSON.stringify(game.data));

  socket.on('blackjack', function(msg){
    var tmp = msg.split(' ');

    switch(tmp[0]) {
      case 'hit':
        if (!game.hit()) {
          io.emit('error', '请不要调皮...');
        }
        break;

      case 'deal':
        if (!game.judgeBet(tmp[1])) {
          io.emit('error', 'bet 值不合法，请检查...');
        } else if (!game.deal(tmp[1])) {
          io.emit('error', '请不要调皮...');
        }
        break;

      case 'stand':
        if (!game.stand()) {
          io.emit('error', '请不要调皮...');
        }
        break;

      case 'double':
        if (!game.judgeDouble() || !game.double()) {
          io.emit('error', '请不要调皮...');
        }
        break;

      case 'insurance':
        if (!game.insurance()) {
          io.emit('error', '请不要调皮...');
        }
        break;

      case 'surrender':
        if (!game.surrender()) {
          io.emit('error', '请不要调皮...');
        }
        break;

      default:
        console.log('なに！？');
        break;
    }

    io.emit('status', JSON.stringify(game.data));
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
