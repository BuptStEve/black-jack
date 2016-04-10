/*
* @Author: BuptStEve
* @Date:   2016-04-08 21:19:39
* @Last Modified by:   BuptStEve
* @Last Modified time: 2016-04-10 16:37:58
*/

var app  = require('express')(),
    http = require('http').Server(app),
    io   = require('socket.io')(http),
    Deck = require('./deck'),
    game = new Deck().deal();

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  io.emit('status', JSON.stringify(game.data));

  socket.on('blackjack', function(msg){
    switch(msg) {
      case 'hit':
        game.hit();
        io.emit('status', JSON.stringify(game.data));
        break;
      case 'stand':
        game.stand();
        io.emit('status', JSON.stringify(game.data));
        break;
      case 'deal':
        game.deal();
        io.emit('status', JSON.stringify(game.data));
        break;
      default:
        console.log('なに！？');
        break;
    }
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
