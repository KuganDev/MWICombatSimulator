import itemDetailMap from "./data/itemDetailMap.json";
import enhancementLevelTotalMultiplierTable from "./data/enhancementLevelTotalMultiplierTable.json";

class Equipment {
    constructor(id, enhancementLevel) {
        this.id = id;
        this.enhancementLevel = enhancementLevel;
    }

    getCombatStat(combatStat) {
        let gameItem = itemDetailMap[this.id];
        let multiplier = enhancementLevelTotalMultiplierTable[this.enhancementLevel];

        let stat =
            gameItem.equipmentDetail.combatStats[combatStat] +
            multiplier * gameItem.equipmentDetail.combatEnhancementBonuses[combatStat];

        return stat;
    }

    getCombatStyle() {
        let gameItem = itemDetailMap[this.id];

        return gameItem.equipmentDetail.combatStyleHrids[0];
    }
}

export default Equipment;
