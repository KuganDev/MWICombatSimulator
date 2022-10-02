import actionDetailMap from "./data/actionDetailMap.json";
import Monster from "./monster";

class Zone {
    constructor(hrid) {
        this.hrid = hrid;

        let gameZone = actionDetailMap[this.hrid];
        this.monsterSpawnRates = gameZone.monsterSpawnRates;

        let totalProbability = this.monsterSpawnRates
            .map((encounter) => encounter.rate * 100) // Avoid floating point inaccuracies
            .reduce((prev, cur) => prev + cur, 0);
        if (totalProbability != 100) {
            throw new Error("Encounter probabilities do not add up to 1. Zone: " + this.hrid);
        }
    }

    getRandomEncounter() {
        let encounter = null;
        let cumulativeProbability = 0;
        let randomNumber = Math.random();

        for (let i = 0; i < this.monsterSpawnRates.length; i++) {
            cumulativeProbability += this.monsterSpawnRates[i].rate;
            if (cumulativeProbability > randomNumber) {
                encounter = this.monsterSpawnRates[i];
                break;
            }
        }

        // This could happen very rarely due to floating point inaccuracies
        if (encounter == null) {
            encounter = this.monsterSpawnRates[this.monsterSpawnRates.length - 1];
        }

        return encounter.combatMonsterHrids.map((hrid) => new Monster(hrid));
    }
}

export default Zone;
