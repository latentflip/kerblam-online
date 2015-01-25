/* jshint esnext:true */
var React = require('react');
import Game from "./game.es6";

var App = React.createClass({
    render() {
        var g = this.props.gameState;
        var players = Object.keys(g.players).map( (k) => g.players[k] );

        return (
            <div>
                <h1>Kerblam!</h1>
                {players.map( (p) => <Player player={p}/> )}
            </div>
        );
    }
});

var Player = React.createClass({
    render() {
        var player = this.props.player;
        return (
            <div>
                <h2>{player.name}</h2>
                <p>
                    Deck {player.deck} Army {player.army.covertArmy}
                </p>
                <ul>
                    {player.army.frontLine.map( (card) => <li>{card.type}</li> )}
                </ul>
            </div>
        );
    }
});


var socket = require('socket.io-client')('http://localhost:8080');

socket.on('connect', function () {
    var [room,name] = window.location.hash.replace(/^#/, '').split('@');
    if (!room || !name) {
        window.location = window.location.pathname + '#war@phil';
        return;
    }

    var game = new Game(room, name, socket);
    game.join();

    //Game.startGame = function () {
    //    console.log('Starting game');
    //    socket.emit('game:start');
    //};

    //socket.emit('game:join', room, name);

    //socket.on('game:rejected', function () {
    //    React.renderComponent(<p>Sorry, full up!</p>, document.body);
    //});

    socket.on('game:joined', function (status) {
        React.renderComponent(
            <div>
                <p>{name} joined, waiting for start!</p>
                <button onClick={game.start.bind(game)}>Start!</button>
            </div>, document.body);
    });

    socket.on('game:state', function (gameState) {
        React.renderComponent(<App gameState={gameState}/>, document.body);
    });

    //socket.on('game:started', function () {
    //    console.log('Got game started event');
    //    React.renderComponent(<p>Started</p>, document.body);
    //});
});

