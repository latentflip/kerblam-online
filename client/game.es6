/* jshint esnext:true */
export default class Game {
    constructor(gameName, playerName, socket) {
        this.gameName = gameName;
        this.playerName = playerName;
        this.socket = socket;
    }

    join() {
        console.log('Game:joining', this.gameName);
        this.socket.emit('game:join', this.gameName, this.playerName);       
    }

    start() {
        console.log('Game:starting', this.gameName);
        this.socket.emit('game:start');
    }
}
