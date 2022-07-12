import CombatUnit from "./combatUnit";

class Player extends CombatUnit {
    equipment = {
        "/equipment_types/head": null,
        "/equipment_types/body": null,
        "/equipment_types/legs": null,
        "/equipment_types/feet": null,
        "/equipment_types/hands": null,
        "/equipment_types/main_hand": null,
        "/equipment_types/two_hand": null,
        "/equipment_types/off_hand": null,
        "/equipment_types/pouch": null,
    };

    constructor() {
        super();

        this.player = true;
    }

    updateCombatStats() {
        if (this.equipment["/equipment_types/main_hand"]) {
            this.combatStats.combatStyleHrid = this.equipment["/equipment_types/main_hand"].getCombatStyle();
            this.combatStats.attackInterval =
                this.equipment["/equipment_types/main_hand"].getCombatStat("attackInterval");
        } else if (this.equipment["/equipment_types/two_hand"]) {
            this.combatStats.combatStyleHrid = this.equipment["/equipment_types/two_hand"].getCombatStyle();
            this.combatStats.attackInterval =
                this.equipment["/equipment_types/two_hand"].getCombatStat("attackInterval");
        } else {
            this.combatStats.combatStyleHrid = "/combat_styles/smash";
            this.combatStats.attackInterval = 3000000000;
        }

        [
            "stabAccuracy",
            "slashAccuracy",
            "smashAccuracy",
            "stabDamage",
            "slashDamage",
            "smashDamage",
            "stabEvasion",
            "slashEvasion",
            "smashEvasion",
            "armor",
            "lifeSteal",
        ].forEach((stat) => {
            this.combatStats[stat] = Object.values(this.equipment)
                .filter((e) => e != null)
                .map((e) => e.getCombatStat(stat))
                .reduce((prev, cur) => prev + cur);
        });

        if (this.equipment["/equipment_types/pouch"]) {
            this.combatStats.foodSlots = 1 + this.equipment["/equipment_types/pouch"].getCombatStat("foodSlots");
            this.combatStats.drinkSlots = this.equipment["/equipment_types/pouch"].getCombatStat("drinkSlots");
        } else {
            this.combatStats.foodSlots = 1;
            this.combatStats.drinkSlots = 0;
        }

        this.combatStats.HPRegen = 0.005;
        this.combatStats.MPRegen = 0.01;
        this.combatStats.dropRate = 0;

        super.updateCombatStats();
    }
}

export default Player;
