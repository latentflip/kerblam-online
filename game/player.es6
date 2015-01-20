/* jshint esnext:true */

var f = require('fkit');
var im = require('immutable');

import contracts from "./contracts.es6";
import Army from "./army.es6";

export const totalOp = (player) => {
    return Army.reduceArmy(
        player.get('army'),
        (total, card) => total + card.get('op'),
        0
    );
};

export const killCard = (player, card) => {
    var withoutCard = (list) => list.filter( (c) => !im.is(c, card));
    contracts.ok(Army.flattenArmy(player.get('army')).contains(card));

    return player.updateIn(['graveyard', 'cards'], (g) => g.push(card))
                 .updateIn(['army', 'frontLine'], withoutCard)
                 .updateIn(['army', 'covertArmy'], withoutCard);
};

export const killFirstCard = (player) => {
    contracts.ok(player);
    contracts.gt(Army.totalSize(player.get('army')), 0);

    var card = player.getIn(['army', 'frontLine', 0]) || player.getIn(['army', 'covertArmy', 0]);
    return killCard(player, card);
};

export const killFirstCardFromArmyLine = (player, armyLineName) => {
    contracts.ok(player);
    var armyLine = player.getIn(['army', armyLineName]);
    if (armyLine.size === 0) return player;

    var card = armyLine.first();
    return player.updateIn(['graveyard', 'cards'], (g) => g.push(card))
                 .updateIn(['army', armyLineName], (cards) => cards.filter( (c) => !im.is(c, card)));
};

export const killNCardsFromArmyLine = (player, armyLineName, n) => {
    contracts.gte(n, 0);
    while (n--) {
        player = killFirstCardFromArmyLine(player, armyLineName);
    }
    return player;
};

export const killHalfCardsFromArmyLine = f.curry((armyLineName, player) => {
    return killNCardsFromArmyLine(player, armyLineName, halfUp(player.getIn(['army', armyLineName]).size));
});

export const killAllCardsFromArmyLine = f.curry((armyLineName, player) => {
    return killNCardsFromArmyLine(player, armyLineName, player.getIn(['army', armyLineName]).size);
});

export const killNCards = (player, n) => {
    contracts.gte(n, 0);

    while(n--) {
        player = killFirstCard(player);
    }

    return player;
};
