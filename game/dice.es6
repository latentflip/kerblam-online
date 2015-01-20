/* jshint esnext:true */

var f = require('fkit');
var die = f.range(1,6);

function rollDie() {
    return f.sample(1, die);
}

function _roll(n) {
    n = n || 1;
    return f.concatMap(rollDie, f.range(1,n));
}

export default _roll;
export var roll = _roll;
export var totalRoll = (n) => _roll(n).reduce(f.add, 0);
export var sort = (rolledDice) => f.reverse(f.sort(rolledDice));
