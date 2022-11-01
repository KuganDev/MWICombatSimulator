import Ability from "./ability";
import CombatUnit from "./combatUnit";
import Consumable from "./consumable";
import Equipment from "./equipment";

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

        this.isPlayer = true;
        this.hrid = "player";
    }

    static createFromDTO(dto) {
        let player = new Player();

        player.staminaLevel = dto.staminaLevel;
        player.intelligenceLevel = dto.intelligenceLevel;
        player.attackLevel = dto.attackLevel;
        player.powerLevel = dto.powerLevel;
        player.defenseLevel = dto.defenseLevel;

        for (const [key, value] of Object.entries(dto.equipment)) {
            player.equipment[key] = value ? Equipment.createFromDTO(value) : null;
        }

        player.food = dto.food.map((food) => (food ? Consumable.createFromDTO(food) : null));
        player.drinks = dto.drinks.map((drink) => (drink ? Consumable.createFromDTO(drink) : null));
        player.abilities = dto.abilities.map((ability) => (ability ? Ability.createFromDTO(ability) : null));

        return player;
    }

    updateCombatDetails() {
        if (this.equipment["/equipment_types/main_hand"]) {
            this.combatDetails.combatStyleHrid = this.equipment["/equipment_types/main_hand"].getCombatStyle();
            this.combatDetails.attackInterval =
                this.equipment["/equipment_types/main_hand"].getCombatStat("attackInterval");
        } else if (this.equipment["/equipment_types/two_hand"]) {
            this.combatDetails.combatStyleHrid = this.equipment["/equipment_types/two_hand"].getCombatStyle();
            this.combatDetails.attackInterval =
                this.equipment["/equipment_types/two_hand"].getCombatStat("attackInterval");
        } else {
            this.combatDetails.combatStyleHrid = "smash";
            this.combatDetails.attackInterval = 3000000000;
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
            "physicalReflectPower",
        ].forEach((stat) => {
            this.combatDetails[stat] = Object.values(this.equipment)
                .filter((equipment) => equipment != null)
                .map((equipment) => equipment.getCombatStat(stat))
                .reduce((prev, cur) => prev + cur, 0);
        });

        if (this.equipment["/equipment_types/pouch"]) {
            this.combatDetails.foodSlots = 1 + this.equipment["/equipment_types/pouch"].getCombatStat("foodSlots");
            this.combatDetails.drinkSlots = 1 + this.equipment["/equipment_types/pouch"].getCombatStat("drinkSlots");
        } else {
            this.combatDetails.foodSlots = 1;
            this.combatDetails.drinkSlots = 1;
        }

        this.combatDetails.dropRate = 0;
        this.combatDetails.experienceRate = 0;

        super.updateCombatDetails();
    }
}

export default Player;
