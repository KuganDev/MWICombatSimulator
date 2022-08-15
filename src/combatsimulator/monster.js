import Ability from "./ability";
import CombatUnit from "./combatUnit";
import combatMonsterDetailMap from "./data/combatMonsterDetailMap.json";

class Monster extends CombatUnit {
    constructor(hrid) {
        super();

        this.isPlayer = false;
        this.hrid = hrid;

        let gameMonster = combatMonsterDetailMap[this.hrid];
        console.assert(gameMonster, "No monster found for hrid:" + this.hrid);

        for (let i = 0; i < gameMonster.abilities.length; i++) {
            this.abilities[i] = new Ability(gameMonster.abilities[i].abilityHrid, gameMonster.abilities[i].level);
        }
    }

    updateCombatStats() {
        let gameMonster = combatMonsterDetailMap[this.hrid];

        this.staminaLevel = gameMonster.combatDetails.staminaLevel;
        this.intelligenceLevel = gameMonster.combatDetails.intelligenceLevel;
        this.attackLevel = gameMonster.combatDetails.attackLevel;
        this.powerLevel = gameMonster.combatDetails.powerLevel;
        this.defenseLevel = gameMonster.combatDetails.defenseLevel;

        let gameCombatStyle = gameMonster.combatDetails.combatStats.combatStyleHrids[0];
        this.combatStats.combatStyleHrid = gameCombatStyle.slice(gameCombatStyle.lastIndexOf("/") + 1);

        for (const [key, value] of Object.entries(gameMonster.combatDetails.combatStats)) {
            this.combatStats[key] = value;
        }

        super.updateCombatStats();
    }
}

export default Monster;
