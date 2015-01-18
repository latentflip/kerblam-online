/* jshint esnext:true */
import roll from "./dice.es6";

import * as contracts from "./contracts.es6";
contracts.config.enabled = true;

var im = require('immutable');
var f = require('fkit');

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

const makeInitialGamestate = (players) => {
    var _makePlayer = f.curry(makePlayer)(players.length);

    var gameState = im.Map({
        players: im.Map(im.List(players).map((name) => [ name, _makePlayer(name) ]))
    });
    return gameState;
};

const armySize = (army) => {
    return army.get('frontLine').size + army.get('covertArmy').size;
};

const drawCards = (player, n) => {
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
    var size = armySize(player.get('army'));
    var toDraw = size < 10 ? (10 - size) : 0;

    return drawCards(player, toDraw);
};

const updatePlayer = f.curry((fn, name, gameState) => {
    return gameState.updateIn(['players', name], fn);
});

const updateAllPlayers = f.curry((fn, gameState) => {
    for (var name of gameState.get('players').keys()) {
        gameState = gameState.updateIn(['players', name], fn);
    }
    return gameState;
});


const logGameState = (gameState) => {
    gameState.get('players').forEach( (player) => {
        console.log('Player:', player.get('name'),
                    '| Deck:', player.get('deck').size,
                    '| Grave:', player.getIn(['graveyard', 'cards']).size,
                    '| Used nukes:', player.getIn(['graveyard', 'nukes']).size);
        console.log(player.getIn(['army', 'frontLine']).map( (card) => card.get('id') + '-' + card.get('type') ).join(' '));
        console.log(player.getIn(['army', 'covertArmy']).map( (card) => card.get('id') + '-' + card.get('type') ).join(' '));
    });
};

const shuffleDeck = (cards) => {
    return cards.sortBy(Math.random);
};

const shufflePlayerDeck = (player) => {
    return player.updateIn(['deck'], shuffleDeck);
};

const drawAllPlayersToTen = updateAllPlayers(drawToTen);
const shuffleAllPlayerDecks = updateAllPlayers(shufflePlayerDeck);

var gameState = makeInitialGamestate(['Phil', 'Adam', 'Hilary']);

gameState = shuffleAllPlayerDecks(gameState);
gameState = drawAllPlayersToTen(gameState);
logGameState(gameState);

const howManyToDraw = (roll) => {
    var count = roll[0] + roll[1];
    if (roll[0] !== roll[1]) {
        count = Math.ceil(count/2);
    }
    return count;
};

const takeTurn = (name) => {
    var roll2 = roll(2);
};
