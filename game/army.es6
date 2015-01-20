/* jshint esnext:true */

var f = require('fkit');

export const flattenArmy = (army) => {
    return army.get('frontLine').concat(army.get('covertArmy'));
};

export const reduceArmy = (army, fn, initial) => {
    return flattenArmy(army).reduce(fn, initial);
};

export var totalSize = (army) => {
    return flattenArmy(army).size;
};
