/* jshint esnext:true */
import roll from "./dice.es6";

var im = require('immutable');
var f = require('fkit');

const makeCard = (i, type, op) => {
    return im.Map({
        id: i,
        type: type,
        op: op
    });
};

const makeCardFactory = (type, op) => {
    return (i) => makeCard(i, type, op);
};

const cardSet = {
    General: makeCardFactory('General', 10),
    Medic: makeCardFactory('Medic', 5),
    Sniper: makeCardFactory('Sniper', 5),
    Spy: makeCardFactory('Spy', 5),
    Soldier: makeCardFactory('Soldier', 0),
    Nuke: makeCardFactory('Nuke', 0)
};


const makeDeck = (nPlayers) => {
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

const drawToTen = (player) => {
    var size = armySize(player.get('army'));
    var toDraw = size < 10 ? (10 - size) : 0;

    var nextCard;

    while (toDraw--) {
        nextCard = player.getIn(['deck', 0]);
        player = player.updateIn(['army', 'frontLine'], (frontLine) => frontLine.push(nextCard));
        player = player.updateIn(['deck'], (deck) => deck.shift());
    }

    return player;
};

const drawAllToTen = (gameState) => {
    var name;
    for (name of gameState.get('players').keys()) {
        gameState = gameState.updateIn(['players', name], drawToTen);
    }
    return gameState;
};

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

var gameState = makeInitialGamestate(['Phil', 'Adam', 'Hilary']);
logGameState(gameState);

gameState = drawAllToTen(gameState);
logGameState(gameState);
