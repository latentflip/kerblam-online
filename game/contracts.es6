/* jshint esnext: true */
var nodeAssert = require('assert');

class ContractError extends TypeError {
    constructor (message, caller) {
        Error.captureStackTrace(this, caller);
        this.message = message;
    }
}

function check(bool, message, caller) {
    if (!bool) {
        throw new ContractError(message, caller);
    }
}

export var config = { enabled: false };

const makeContract = (fn) => {
    return (...args) => {
        if (!config.enabled) return true;
        return fn(...args);
    };
};

export var ok = makeContract((fnOrVal) => {
    if (typeof fnOrVal === 'function') {
        fnOrVal = fnOrVal();
    }
    nodeAssert.ok(fnOrVal);
});

export var gt = makeContract( (val, lim) => {
    check(val > lim, `Expected ${val} > ${lim}`, gt);
});

export var gte = makeContract( (val, lim) => {
    check(val >= lim, `Expected ${val} >= ${lim}`, gte);
});

export var eq = makeContract( (val, comp) => {
    check(val === comp, `Expected ${val} == ${comp}`, eq);
});

export var isNumber = makeContract( (val) => {
    check(typeof val === 'number', `Expected ${val} to be a number`, isNumber);
});
