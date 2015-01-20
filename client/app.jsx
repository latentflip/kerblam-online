/* jshint esnext:true */
var React = require('react');

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
            </div>
        );
    }
});


var socket = require('socket.io-client')('http://localhost:8080');
socket.on('connect', function () {
    socket.on('game:state', function (gameState) {
        React.renderComponent(<App gameState={gameState}/>, document.body);
    });
});

