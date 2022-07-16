import CombatUtilities from "./combatUtilities";
import AutoAttackEvent from "./events/autoAttackEvent";
import CombatStartEvent from "./events/combatStartEvent";
import EventQueue from "./events/eventQueue";

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
            case AutoAttackEvent.type:
                this.processAutoAttackEvent(event);
                break;
        }
    }

    processCombatStartEvent(event) {
        console.log(this.simulationTime / 1e9, event.type, event);

        this.players[0].reset();
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

        // TODO: process hit

        this.addNextAutoAttackEvent(event.source);
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
