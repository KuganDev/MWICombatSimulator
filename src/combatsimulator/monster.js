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
        console.assert(gameMonster, "No monster found for hrid:" + this.hrid);

        this.staminaLevel = gameMonster.combatDetails.staminaLevel;
        this.intelligenceLevel = gameMonster.combatDetails.intelligenceLevel;
        this.attackLevel = gameMonster.combatDetails.attackLevel;
        this.powerLevel = gameMonster.combatDetails.powerLevel;
        this.defenseLevel = gameMonster.combatDetails.defenseLevel;

        let gameCombatStyle = gameMonster.combatDetails.combatStyleHrid;
        this.combatStats.combatStyleHrid = gameCombatStyle.slice(gameCombatStyle.lastIndexOf("/") + 1);

        for (const [key, value] of Object.entries(gameMonster.combatDetails.combatStats)) {
            this.combatStats[key] = value;
        }

        super.updateCombatStats();
    }
}

export default Monster;
