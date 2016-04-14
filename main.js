/*
* @Author: BuptStEve
* @Date:   2016-04-08 21:19:39
* @Last Modified by:   BuptStEve
* @Last Modified time: 2016-04-14 20:19:49
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

app.use('/static', express.static(__dirname + '/static')); // 静态资源

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

      var tmp = msg.split('|'),
          num = roomInfo.users.indexOf(socket); // 闲家的下标

      if (num === -1) { return false; }

      switch(tmp[0]) {
        case 'deal':
          if (!roomInfo.game.judgeBet(tmp[1], num)) {
            io.emit('error', 'bet值不合法,请检查...|' + socket.id);
          } else if (!roomInfo.game.deal(tmp[1], num)) {
            io.emit('error', '请不要调皮...|' + socket.id);
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
            io.emit('error', '请不要调皮...|' + socket.id);
          }
          break;
        case 'stand':
          if (!roomInfo.game.stand()) {
            io.emit('error', '请不要调皮...|' + socket.id);
          }
          break;
        case 'double':
          if (!roomInfo.game.judgeDouble() || !roomInfo.game.double()) {
            io.emit('error', '请不要调皮...|' + socket.id);
          }
          break;
        case 'insurance':
          if (!roomInfo.game.insurance()) {
            io.emit('error', '请不要调皮...|' + socket.id);
          }
          break;
        case 'surrender':
          if (!roomInfo.game.surrender()) {
            io.emit('error', '请不要调皮...|' + socket.id);
          }
          break;
        default:
          io.emit('error', '请不要调皮...|' + socket.id);
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

  // 失联时
  socket.on('disconnect', function () {
    var index = roomInfo.users.indexOf(socket);
    console.log(socket.id + ' disconnected...');

    if (index !== -1) {
      roomInfo.users.splice(index, 1);
      roomInfo.game = new Deck();
      io.to('players').emit('status', JSON.stringify(roomInfo.game.plrData));
      io.to('dealer').emit('status', JSON.stringify(roomInfo.game.plrData));
      socket.leave('players'); // 退出房间
      socket.leave('dealer');  // 退出房间
    }
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
