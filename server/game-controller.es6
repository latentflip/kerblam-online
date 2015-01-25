/* jshint esnext:true */
import Kerblam from "../game/game.es6";
var im = require('immutable');

export var config = {};
export var games = {};
export var players = {};

export const createGame = (gameName, cb) => {
    if (games[gameName]) {
        console.log('GameController:game:alreadyExists', gameName);
        cb(new Error("Already Exists"));
    } else {
        console.log('GameController:game:created', gameName);
        games[gameName] = {
            players: {},
            history: im.List(),
        };
        cb();
    }
};

export const joinGame = (gameName, playerName, socket, cb) => {
    console.log('GameController:player:created', playerName);
    players[socket.id] = {
        id: socket.id,
        name: playerName,
        gameName: gameName,
        socket: socket
    };
    console.log('GameController:game:playerAdded', gameName, "+" + playerName);
    games[gameName].players[socket.id] = players[socket.id];
    cb();
};

export const createAndJoin = (gameName, playerName, socket, cb) => {
    createGame(gameName, function () {
        joinGame(gameName, playerName, socket, cb);
        socket.join(gameName);
    });
};

export const emitGameStateToAllPlayers = (gameName) => {
    var game = games[gameName];
    if (!game) { throw "Unknown game:" + gameName; }
    console.log("GameController:game:emitState", gameName);

    Object.keys(game.players).forEach(function (playerName) {
        var state = Kerblam.cleanseForPlayer(game.state, playerName);
        game.players[playerName].socket.emit('game:state', state.toJS());
    });
};

export const updateGameState = (gameName, gameState) => {
    var game = games[gameName];
    if (!game) { throw new Error("Unknown game: " + gameName); }
    game.history = game.history.push(game.state);
    game.state = gameState;
    emitGameStateToAllPlayers(gameName);
};

export const startGameFromPlayerId = (socketId) => {
    var player, gameName, game, state;

    player = players[socketId];
    gameName = player && player.gameName;
    game = gameName && games[gameName];

    if (!player) { throw "Cannot find player with socketId: " + socketId; }
    if (!game) { throw "Cannot find game with name: " + gameName; }

    console.log("GameController:game:started", gameName, "by", player.name + "(" + socketId + ")");

    updateGameState(gameName, state = Kerblam.makeInitialGamestate(Object.keys(game.players)));
    updateGameState(gameName, state = Kerblam.shuffleAllPlayerDecks(state));
    updateGameState(gameName, state = Kerblam.drawAllPlayersToTen(state));
};

export const removeSocketId = (socketId) => {
    var player = players[socketId];
    var gameName = player && player.gameName;
    var game = gameName && games[gameName];
    console.log('GameController:player:left', gameName, player && player.name + "(" + socketId + ")"); 
    if (players[socketId]) {
        delete players[socketId];
    }
    if (game) {
        delete game.players[socketId];
    }
};
