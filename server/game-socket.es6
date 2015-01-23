/* jshint esnext:true */
import Kerblam from "../game/game.es6";

exports.register = function (server, options, next) {
    var io = require('socket.io').listen(server.select('game').listener,{log:false});

    var games = {};

    var pushGameState = function (room, gameState) {
        io.to(room).emit('game:state', gameState.toJS());
    };

    io.sockets.on('connection', function (socket) {
        socket.on('game:join', function (game, player) {
            if (!games[game]) {
                games[game] = {
                    name: game,
                    started: false,
                    owner: player,
                    players: {
                        [player]: socket
                    }
                };
                socket.join(game);
                socket.emit('game:joined', { owner: true });
                socket.on('game:start', function () {
                    games[game].state = Kerblam.makeInitialGamestate(Object.keys(games[game].players));
                    console.log('Got game start');
                    io.to(game).emit('game:started');
                    games[game].state =
                        Kerblam.drawAllPlayersToTen(
                            Kerblam.shuffleAllPlayerDecks(games[game].state)
                        );
                    pushGameState(game, games[game].state);
                });
            } else {
                if (!games[game].started) {
                    games[game].players[player] = socket;
                    socket.emit('game:joined', { owner: player === games[game].owner });
                    if (player === games[game].owner) {
                        socket.join(game);
                        socket.on('game:start', function () {
                            console.log('Got game start');
                            io.to(game).emit('game:started');
                        });
                    }
                } else {
                    socket.emit('game:rejected');
                }
            }
            console.log(Object.keys(games[game].players));
        });
        //console.log('Player joined');
        //socket.emit('game:state', game.toJS());
        //setTimeout(function () {
        //    game = Kerblam.shuffleAllPlayerDecks(game);
        //    socket.emit('game:state', game.toJS());
        //}, 2000);

        //setTimeout(function () {
        //    game = Kerblam.drawAllPlayersToTen(game);
        //    socket.emit('game:state', game.toJS());
        //}, 4000);
    });
};
exports.register.attributes = {
    name: 'socket-plugin',
    version: '1.0.0'
};
