/* jshint esnext:true */
import Kerblam from "../game/game.es6";

exports.register = function (server, options, next) {
    var io = require('socket.io').listen(server.select('game').listener,{log:false});

    var game = Kerblam.makeInitialGamestate([
        'Phil',
        'Adam'
    ]);

    io.sockets.on('connection', function (socket) {
        console.log('Player joined');
        socket.emit('game:state', game.toJS());
        setTimeout(function () {
            game = Kerblam.shuffleAllPlayerDecks(game);
            socket.emit('game:state', game.toJS());
        }, 2000);

        setTimeout(function () {
            game = Kerblam.drawAllPlayersToTen(game);
            socket.emit('game:state', game.toJS());
        }, 4000);

    });
};
exports.register.attributes = {
    name: 'socket-plugin',
    version: '1.0.0'
};
