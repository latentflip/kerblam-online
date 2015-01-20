/* jshint esnext:true */

import Army from "./army.es6";
import contracts from "./contracts.es6";
var im = require('immutable');
var f = require('fkit');

const updateAllPlayers = f.curry((fn, gameState) => {
    for (var name of gameState.get('players').keys()) {
        gameState = gameState.updateIn(['players', name], fn);
    }
    return gameState;
});

export var getPlayer = (name, gameState) => {
    return gameState.getIn(['players', name]);
};

export var updatePlayer = (fn, name, gameState) => {
    return gameState.updateIn(['players', name], fn);
};

const makeCard = (i, type, op, isRed) => {
    return im.Map({
        id: i,
        type: type,
        op: op,
        isRed: isRed
    });
};

const makeCardFactory = (type, op, alternate) => {
    alternate = alternate || false;
    var isRed = false;
    return (i) => {
        if (alternate) {
            isRed = !isRed;
        }
        return makeCard(i, type, op, isRed);
    };
};


const makeDeck = (nPlayers) => {
    var cardSet = {
        General: makeCardFactory('General', 10, true),
        Medic: makeCardFactory('Medic', 5, true),
        Sniper: makeCardFactory('Sniper', 5, true),
        Spy: makeCardFactory('Spy', 5, true),
        Soldier: makeCardFactory('Soldier', 0, true),
        Nuke: makeCardFactory('Nuke', 0)
    };

    var i = 1;

    var nSoldiers = (9 * 4);

    if (nPlayers > 2) {
        nSoldiers -= 4 * (nPlayers - 1);
    }

    var nNukes = nPlayers;

    return im.List([
        im.Range(i,i+=4).map(cardSet.General),
        im.Range(i,i+=4).map(cardSet.Medic),
        im.Range(i,i+=4).map(cardSet.Sniper),
        im.Range(i,i+=4).map(cardSet.Spy),
        im.Range(i,i+=nSoldiers).map(cardSet.Soldier),
        im.Range(i,i+=nNukes).map(cardSet.Nuke)
    ]).flatten(1);
};

const makeGraveyard = () => {
    return im.Map({
        cards: im.List(),
        nukes: im.List()
    });
};

const makeArmy = () => {
    return im.Map({
        frontLine: im.List(),
        covertArmy: im.List()
    });
};

const makePlayer = (nPlayers, name) => {
    return im.Map({
        name: name,
        deck: makeDeck(nPlayers),
        graveyard: makeGraveyard(),
        army: makeArmy()
    });
};


export const makeInitialGamestate = (players) => {
    var _makePlayer = f.curry(makePlayer)(players.length);

    var gameState = im.Map({
        players: im.Map(im.List(players).map((name) => [ name, _makePlayer(name) ]))
    });
    return gameState;
};


const drawCards = (n, player) => {
    contracts.isNumber(n);
    contracts.gte(n, 0);

    var nextCard, targetArmy;

    while (n--) {
        nextCard = player.get('deck').first();
        targetArmy = nextCard.get('isRed') ? 'frontLine' : 'covertArmy';
        player = player.updateIn(['army', targetArmy], (lineup) => lineup.push(nextCard));
        player = player.updateIn(['deck'], (deck) => deck.shift());
    }

    return player;
};


const drawToTen = (player) => {
    var size = Army.totalSize(player.get('army'));
    var toDraw = size < 10 ? (10 - size) : 0;

    return drawCards(toDraw, player);
};
const shuffleDeck = (cards) => {
    return cards.sortBy(Math.random);
};

const shufflePlayerDeck = (player) => {
    return player.updateIn(['deck'], shuffleDeck);
};

export const drawAllPlayersToTen = updateAllPlayers(drawToTen);
export const shuffleAllPlayerDecks = updateAllPlayers(shufflePlayerDeck);
