/* jshint esnext:true */

var f = require('fkit');
var die = f.range(1,6);

function rollDie() {
    return f.sample(1, die);
}

function roll(n) {
    n = n || 1;
    return f.concatMap(rollDie, f.range(1,n));
}

export default roll;
