/*
* @Author: BuptStEve
* @Date:   2016-04-08 21:19:39
* @Last Modified by:   BuptStEve
* @Last Modified time: 2016-04-13 21:05:41
*/

var express = require('express'),
    app     = express(),
    http    = require('http').Server(app),
    io      = require('socket.io')(http),
    Deck    = require('./deck'),
    roomInfo = {
      len  : 2, // 限制人数
      game : new Deck(),
      users: [] // 用户列表
    };

app.use('/img', express.static(__dirname + '/img')); // 静态资源

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log(socket.id + ' connected...');

  if (roomInfo.users.length < roomInfo.len) {
    roomInfo.users.push(socket);
    socket.join('players'); // 加入玩家房间
    console.log(socket.id + ' join players\' room...');
    io.to('players').emit('status', JSON.stringify(roomInfo.game.plrData));

    // 客户端发来的 actions
    socket.on('blackjack', function(msg){
      console.log(socket.id + ' send a msg...');
      console.log('users: ' + roomInfo.users[0].id + ' ' + roomInfo.users[1].id);

      var tmp = msg.split(' '),
          num = roomInfo.users.indexOf(socket); // 闲家的下标

      if (num === -1) { return false; }

      switch(tmp[0]) {
        case 'deal':
          if (!roomInfo.game.judgeBet(tmp[1], num)) {
            socket.emit('error', 'bet 值不合法，请检查...');
          } else if (!roomInfo.game.deal(tmp[1], num)) {
            socket.emit('error', '请不要调皮...');
          } else {
            roomInfo.users.map(function(x) {
              if (x.id === socket.id) {
                x.leave('dealer');
                x.join('players');
              } else {
                x.leave('players');
                x.join('dealer');
              }
            });
          }
          break;
        case 'hit':
          if (!roomInfo.game.hit()) {
            io.to('players').emit('error', '请不要调皮...');
          }
          break;
        case 'stand':
          if (!roomInfo.game.stand()) {
            io.to('players').emit('error', '请不要调皮...');
          }
          break;
        case 'double':
          if (!roomInfo.game.judgeDouble() || !roomInfo.game.double()) {
            io.to('players').emit('error', '请不要调皮...');
          }
          break;
        case 'insurance':
          if (!roomInfo.game.insurance()) {
            io.to('players').emit('error', '请不要调皮...');
          }
          break;
        case 'surrender':
          if (!roomInfo.game.surrender()) {
            io.to('players').emit('error', '请不要调皮...');
          }
          break;
        default:
          console.log('なに！？');
          break;
      }

      io.to('dealer').emit('status', JSON.stringify(roomInfo.game.dlrData));
      io.to('players').emit('status', JSON.stringify(roomInfo.game.plrData));
    });
  }

  if (roomInfo.users.length === roomInfo.len) {
    roomInfo.game.init(); // 初始化
    io.to('players').emit('status', JSON.stringify(roomInfo.game.plrData));
  }

  socket.on('disconnect', function () {
    var index = roomInfo.users.indexOf(socket);
    console.log(socket.id + ' disconnected...');

    if (index !== -1) {
      roomInfo.users.splice(index, 1);
      roomInfo.game = new Deck();
      io.to('players').emit('status', JSON.stringify(roomInfo.game.plrData));
      socket.leave('players'); // 退出房间
      socket.leave('dealer'); // 退出房间
    }
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
