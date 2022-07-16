import itemDetailMap from "./data/itemDetailMap.json";
import enhancementLevelTotalMultiplierTable from "./data/enhancementLevelTotalMultiplierTable.json";

class Equipment {
    constructor(hrid, enhancementLevel) {
        this.hrid = hrid;
        this.enhancementLevel = enhancementLevel;
    }

    getCombatStat(combatStat) {
        let gameItem = itemDetailMap[this.hrid];
        console.assert(gameItem, "No equipment found for hrid:" + this.hrid);

        let multiplier = enhancementLevelTotalMultiplierTable[this.enhancementLevel];

        let stat =
            gameItem.equipmentDetail.combatStats[combatStat] +
            multiplier * gameItem.equipmentDetail.combatEnhancementBonuses[combatStat];

        return stat;
    }

    getCombatStyle() {
        let gameItem = itemDetailMap[this.hrid];
        console.assert(gameItem, "No equipment found for hrid:" + this.hrid);

        return gameItem.equipmentDetail.combatStyleHrids[0];
    }
}

export default Equipment;
