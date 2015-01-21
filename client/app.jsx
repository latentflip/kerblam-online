/* jshint esnext:true */
var React = require('react');
var Game = {};

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
                    Deck {player.deck.length} Army {player.army.frontLine.length + player.army.covertArmy.length}
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
    var [room,name] = window.location.hash.split('@');

    Game.startGame = function () {
        console.log('Starting game');
        socket.emit('game:start');
    };

    socket.emit('game:join', room, name);

    socket.on('game:state', function (gameState) {
        React.renderComponent(<App gameState={gameState}/>, document.body);
    });

    socket.on('game:rejected', function () {
        React.renderComponent(<p>Sorry, full up!</p>, document.body);
    });

    socket.on('game:joined', function (status) {
        if (status.owner) {
            React.renderComponent(<p>Joined, waiting for start! <button onClick={Game.startGame}>Start!</button></p>, document.body);
        } else {
            React.renderComponent(<p>Joined, waiting for start!</p>, document.body);
        }
    });

    socket.on('game:started', function () {
        console.log('Got game started event');
        React.renderComponent(<p>Started</p>, document.body);
    });
});

