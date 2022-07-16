import CombatUtilities from "./combatUtilities";
import AutoAttackEvent from "./events/autoAttackEvent";
import CombatStartEvent from "./events/combatStartEvent";
import EnemyRespawnEvent from "./events/enemyRespawnEvent";
import EventQueue from "./events/eventQueue";
import PlayerRespawnEvent from "./events/playerRespawnEvent";

class CombatSimulator {
    constructor(player, zone) {
        this.players = [player];
        this.zone = zone;

        this.eventQueue = new EventQueue();
    }

    simulate(simulationTimeLimit) {
        this.reset();

        let combatStartEvent = new CombatStartEvent(0);
        this.eventQueue.addEvent(combatStartEvent);

        while (this.simulationTime < simulationTimeLimit) {
            let nextEvent = this.eventQueue.getNextEvent();
            this.processEvent(nextEvent);
        }
    }

    reset() {
        this.simulationTime = 0;
        this.eventQueue.clear();
    }

    processEvent(event) {
        this.simulationTime = event.time;

        switch (event.type) {
            case CombatStartEvent.type:
                this.processCombatStartEvent(event);
                break;
            case PlayerRespawnEvent.type:
                this.processPlayerRespawnEvent(event);
                break;
            case EnemyRespawnEvent.type:
                this.processEnemyRespawnEvent(event);
                break;
            case AutoAttackEvent.type:
                this.processAutoAttackEvent(event);
                break;
        }
    }

    processCombatStartEvent(event) {
        console.log(this.simulationTime / 1e9, event.type, event);

        this.players[0].reset();

        this.startNewEncounter();
    }

    processPlayerRespawnEvent(event) {
        console.log(this.simulationTime / 1e9, event.type, event);

        this.players[0].combatStats.currentHitpoints = this.players[0].combatStats.maxHitpoints / 2;
        this.players[0].combatStats.currentManapoints = this.players[0].combatStats.maxManapoints / 2;

        this.startNewEncounter();
    }

    processEnemyRespawnEvent(event) {
        console.log(this.simulationTime / 1e9, event.type, event);

        this.startNewEncounter();
    }

    startNewEncounter() {
        this.enemies = this.zone.getRandomEncounter();
        this.enemies.forEach((enemy) => {
            enemy.reset();
        });

        this.addNextAutoAttackEvent(this.players[0]);

        this.enemies.forEach((enemy) => this.addNextAutoAttackEvent(enemy));
    }

    processAutoAttackEvent(event) {
        console.log(this.simulationTime / 1e9, event.type, event);
        console.log("source:", event.source.hrid, "target:", event.target.hrid);

        let combatStyle = event.source.combatStats.combatStyleHrid;
        let maxDamage = event.source.combatStats[combatStyle + "MaxDamage"];
        let damageRoll = CombatUtilities.randomInt(1, maxDamage);
        let premitigatedDamage = Math.min(damageRoll, event.target.combatStats.currentHitpoints);

        let damage = 0;
        let hitChance = CombatUtilities.calculateHitChance(event.source, event.target, combatStyle);

        if (Math.random() < hitChance) {
            let damageTakenRatio = 100 / (100 + event.target.combatStats.armor);
            let mitigatedDamage = damageTakenRatio * premitigatedDamage;
            damage = CombatUtilities.randomInt(mitigatedDamage, mitigatedDamage);
            event.target.combatStats.currentHitpoints -= damage;

            if (event.target.combatStats.currentHitpoints == 0) {
                this.eventQueue.clearEventsForUnit(event.target);
            }

            console.log("Hit for", damage);
        }

        let damagePrevented = premitigatedDamage - damage;

        if (event.source.isPlayer && !this.enemies.find((enemy) => enemy.combatStats.currentHitpoints > 0)) {
            let respawnEvent = new EnemyRespawnEvent(this.simulationTime + 3 * 1e9);
            this.eventQueue.addEvent(respawnEvent);
        } else if (!event.source.isPlayer && !this.players.find((player) => player.combatStats.currentHitpoints > 0)) {
            let respawnEvent = new PlayerRespawnEvent(this.simulationTime + 180 * 1e9);
            this.eventQueue.addEvent(respawnEvent);
        } else {
            this.addNextAutoAttackEvent(event.source);
        }
    }

    addNextAutoAttackEvent(source) {
        let target;
        if (source.isPlayer) {
            target = CombatUtilities.getTarget(this.enemies);
        } else {
            target = CombatUtilities.getTarget(this.players);
        }

        let attack = new AutoAttackEvent(this.simulationTime + source.combatStats.attackInterval, source, target);
        this.eventQueue.addEvent(attack);
    }
}

export default CombatSimulator;
