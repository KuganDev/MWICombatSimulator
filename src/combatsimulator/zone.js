import actionDetailMap from "./data/actionDetailMap.json"
import Monster from "./monster";

class Zone {
    constructor(hrid) {
        this.hrid = hrid;

        let gameZone = actionDetailMap[this.hrid];
        this.monsterSpawnRates = gameZone.monsterSpawnRates;
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

        return encounter.combatMonsterHrids.map(hrid => new Monster(hrid));
    }
}

export default Zone;