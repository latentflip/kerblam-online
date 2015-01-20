/* jshint esnext:true */
var im = require('immutable');
var f = require('fkit');

import roll from "./dice.es6";
import * as contracts from "./contracts.es6";
import * as actions from "./actions.es6";
contracts.config.enabled = true;

const sortedRoll = (n) => f.reverse(f.sort(roll(n)));
const totalRoll = (n) => roll(n).reduce(f.add, 0);

const halfUp = (n) => Math.ceil(n/2);

var partial = (fn, ...args) => {
    return fn.bind(null, ...args);
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
    var size = armySize(player.get('army'));
    var toDraw = size < 10 ? (10 - size) : 0;

    return drawCards(toDraw, player);
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

const flattenArmy = (army) => {
    return army.get('frontLine').concat(army.get('covertArmy'));
};

const reduceArmy = (army, fn, initial) => {
    return flattenArmy(army, fn, initial);
};

const countOp = (player) => {
    return flattenArmy(player.get('army')).reduce(
        (total, card) => total + card.get('op'),
        0
    );
};


const logGameState = (gameState) => {
    gameState.get('players').forEach( (player) => {
        console.log('Player:', player.get('name'),
                    '| OP: ', countOp(player),
                    '| Deck:', player.get('deck').size,
                    '| Army:', armySize(player.get('army')),
                    '| Grave:', player.getIn(['graveyard', 'cards']).size,
                    '| Used nukes:', player.getIn(['graveyard', 'nukes']).size);
        console.log(player.getIn(['army', 'frontLine']).map( (card) => card.get('id') + '-' + card.get('type') ).join(' '));
        console.log(player.getIn(['army', 'covertArmy']).map( (card) => card.get('id') + '-' + card.get('type') ).join(' '));
        console.log('');
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

const takeTurn = (name, gameState) => {
    var roll2 = roll(2);
    console.log('Rolled', roll2);
    var _drawCards = f.curry(drawCards)(howManyToDraw(roll2));

    return updatePlayer(_drawCards, name, gameState);
};

const sortDice = (dice) => f.reverse(f.sort(dice));

const compareDieWithAdvantage = (attackDie, defendDie, advantage) => {
    if (attackDie > defendDie) return 'attacker';
    if (defendDie > attackDie) return 'defender';
    return advantage;
};

const getLossesWithAdvantage = (attackDice, defendDice, advantage) => {
    var zippedDice = im.List(attackDice).zip(im.List(defendDice));
    var results = zippedDice.map( (dicePair) => compareDieWithAdvantage(...dicePair, advantage));
    results = results.countBy( (v) => {
        return v === 'attacker' ? 'defenderLost' : 'attackerLost';
    });
    return {
        attackerLost: results.get('attackerLost', 0),
        defenderLost: results.get('defenderLost', 0)
    };
};


//const attackRoll = (attacker, defender) => {
//    var attackDice = sortedRoll(Math.min(3, armySize(attacker.get('army'))));
//    var defendDice = sortedRoll(Math.min(2, armySize(defender.get('army'))));
//    var advantageTo;
//
//    if (defender.get('hasAdvantage') || countOp(defender) > countOp(attacker)) {
//        advantageTo = 'defender';
//    } else {
//        advantageTo = 'attacker';
//    }
//
//    var losses = getLossesWithAdvantage(attackDice, defendDice, advantageTo);
//
//    console.log('Attack!');
//    console.log('Attacker'+(advantageTo === 'attacker' ? '*': ''), attacker.get('name'), attackDice, 'Losses:', losses.attackerLost);
//    console.log('Defender'+(advantageTo === 'defender' ? '*': ''), defender.get('name'), defendDice, 'Losses:', losses.defenderLost);
//
//    return im.Map({
//        attacker: im.Map({
//            player: attacker,
//            roll: attackDice,
//            losses: losses.attackerLost
//        }),
//        defender: im.Map({
//            player: defender,
//            roll: defendDice,
//            losses: losses.defenderLost
//        })
//    });
//
//};

const killCard = (player, card) => {
    var withoutCard = (list) => list.filter( (c) => !im.is(c, card));
    contracts.ok(flattenArmy(player.get('army')).contains(card));

    return player.updateIn(['graveyard', 'cards'], (g) => g.push(card))
                 .updateIn(['army', 'frontLine'], withoutCard)
                 .updateIn(['army', 'covertArmy'], withoutCard);
};

const killFirstCard = (player) => {
    contracts.ok(player);
    contracts.gt(armySize(player.get('army')), 0);

    var card = player.getIn(['army', 'frontLine', 0]) || player.getIn(['army', 'covertArmy', 0]);
    return killCard(player, card);
};

const killFirstCardFromArmyLine = (player, armyLineName) => {
    contracts.ok(player);
    var armyLine = player.getIn(['army', armyLineName]);
    if (armyLine.size === 0) return player;

    var card = armyLine.first();
    return player.updateIn(['graveyard', 'cards'], (g) => g.push(card))
                 .updateIn(['army', armyLineName], (cards) => cards.filter( (c) => !im.is(c, card)));
};

const killNCardsFromArmyLine = (player, armyLineName, n) => {
    contracts.gte(n, 0);
    while (n--) {
        player = killFirstCardFromArmyLine(player, armyLineName);
    }
    return player;
};

const killHalfCardsFromArmyLine = f.curry((armyLineName, player) => {
    return killNCardsFromArmyLine(player, armyLineName, halfUp(player.getIn(['army', armyLineName]).size));
});

const killAllCardsFromArmyLine = f.curry((armyLineName, player) => {
    return killNCardsFromArmyLine(player, armyLineName, player.getIn(['army', armyLineName]).size);
});

const killNCards = (player, n) => {
    contracts.gte(n, 0);

    while(n--) {
        player = killFirstCard(player);
    }

    return player;
};

//const attack = (attackerName, defenderName, gameState) => {
//    var results = attackRoll(
//        getPlayer(attackerName, gameState),
//        getPlayer(defenderName, gameState)
//    );
//
//    var attackerLosses = results.getIn(['attacker', 'losses']);
//    var defenderLosses = results.getIn(['defender', 'losses']);
//
//    return gameState.updateIn(['players', attackerName], (player) => killNCards(player, attackerLosses))
//                    .updateIn(['players', defenderName], (player) => killNCards(player, defenderLosses));
//};

const getPlayer = (name, gameState) => {
    return gameState.getIn(['players', name]);
};

console.log('-------- Phil Starts turn ----------');
gameState = takeTurn('Phil', gameState);
logGameState(gameState);

console.log('-------- Phil Attacks Adam ----------');
gameState = actions.attack('Phil', 'Adam', gameState);
logGameState(gameState);

console.log('-------- Phil nukes Adam ---------');
gameState = actions.nuke('Phil', 'Adam', 'covertArmy', gameState);
logGameState(gameState);
