/* jshint esnext: true */

var im = require('immutable');

import Dice from "./dice.es6";
import { getPlayer } from "./game.es6";
import Army from "./army.es6";
import Player from "./player.es6";
import contracts from "./contracts.es6";
import Game from "./game.es6";

export const nuke = (attackerName, defenderName, targetArmy, gameState) => {
    var roll = Dice.totalRoll(2);

    if (roll <= 3) {
        gameState = Game.updatePlayer(Player.killHalfCardsFromArmyLine('covertArmy'), attackerName, gameState);
    } else if (roll <= 6) {
        gameState = Game.updatePlayer(Player.killHalfCardsFromArmyLine(targetArmy), defenderName, gameState);
    } else if (roll <= 11) {
        gameState = Game.updatePlayer(Player.killAllCardsFromArmyLine(targetArmy), defenderName, gameState);
    } else if (roll === 12) {
        gameState = Game.updatePlayer(Player.killAllCardsFromArmyLine('covertArmy'), defenderName, gameState);
        gameState = Game.updatePlayer(Player.killAllCardsFromArmyLine('frontLine'), defenderName, gameState);
    }

    return gameState;
};

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

const attackRoll = (attacker, defender) => {
    var attackDice = Dice.sort(Dice.roll((Math.min(3, Army.totalSize(attacker.get('army'))))));
    var defendDice = Dice.sort(Dice.roll((Math.min(2, Army.totalSize(defender.get('army'))))));
    var advantageTo;

    if (defender.get('hasAdvantage') || Player.totalOp(defender) > Player.totalOp(attacker)) {
        advantageTo = 'defender';
    } else {
        advantageTo = 'attacker';
    }

    var losses = getLossesWithAdvantage(attackDice, defendDice, advantageTo);

    console.log('Attack!');
    console.log('Attacker'+(advantageTo === 'attacker' ? '*': ''), attacker.get('name'), attackDice, 'Losses:', losses.attackerLost);
    console.log('Defender'+(advantageTo === 'defender' ? '*': ''), defender.get('name'), defendDice, 'Losses:', losses.defenderLost);

    return im.Map({
        attacker: im.Map({
            player: attacker,
            roll: attackDice,
            losses: losses.attackerLost
        }),
        defender: im.Map({
            player: defender,
            roll: defendDice,
            losses: losses.defenderLost
        })
    });

};

export const attack = (attackerName, defenderName, gameState) => {
    var results = attackRoll(
        getPlayer(attackerName, gameState),
        getPlayer(defenderName, gameState)
    );

    var attackerLosses = results.getIn(['attacker', 'losses']);
    var defenderLosses = results.getIn(['defender', 'losses']);

    console.log(attackerLosses, defenderLosses);
    return gameState.updateIn(['players', attackerName], (player) => Player.killNCards(player, attackerLosses))
                    .updateIn(['players', defenderName], (player) => Player.killNCards(player, defenderLosses));
};
