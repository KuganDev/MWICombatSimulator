import CombatUnit from "./combatUnit";
import combatMonsterDetailMap from "./data/combatMonsterDetailMap.json";

class Monster extends CombatUnit {
    constructor(hrid) {
        super();

        this.isPlayer = false;
        this.hrid = hrid;
    }

    updateCombatStats() {
        let gameMonster = combatMonsterDetailMap[this.hrid];

        this.staminaLevel = gameMonster.combatDetails.staminaLevel;
        this.intelligenceLevel = gameMonster.combatDetails.intelligenceLevel;
        this.attackLevel = gameMonster.combatDetails.attackLevel;
        this.powerLevel = gameMonster.combatDetails.powerLevel;
        this.defenseLevel = gameMonster.combatDetails.defenseLevel;

        this.combatStats.combatStyleHrid = gameMonster.combatDetails.combatStyleHrid;

        for (const [key, value] of Object.entries(gameMonster.combatDetails.combatStats)) {
            this.combatStats[key] = value;
        }

        super.updateCombatStats();
    }
}

export default Monster;
