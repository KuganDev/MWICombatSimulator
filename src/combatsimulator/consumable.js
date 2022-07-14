import Buff from "./buff";
import itemDetailMap from "./data/itemDetailMap.json";
import Trigger from "./trigger";

class Consumable {
    constructor(hrid, triggers = null) {
        this.hrid = hrid;

        let gameConsumable = itemDetailMap[this.hrid];

        this.cooldownDuration = gameConsumable.consumableDetail.cooldownDuration;
        this.hitpointRestore = gameConsumable.consumableDetail.hitpointRestore;
        this.manapointRestore = gameConsumable.consumableDetail.manapointRestore;
        this.recoveryDuration = gameConsumable.consumableDetail.recoveryDuration;

        this.buffs = [];
        if (gameConsumable.consumableDetail.buffs) {
            for (const consumableBuff of gameConsumable.consumableDetail.buffs) {
                let buff = new Buff(consumableBuff);
                this.buffs.push(buff);
            }
        }

        if (triggers) {
            this.triggers = triggers;
        } else {
            this.triggers = [];
            for (const defaultTrigger of gameConsumable.consumableDetail.defaultCombatTriggers) {
                let trigger = new Trigger(
                    defaultTrigger.dependencyHrid,
                    defaultTrigger.conditionHrid,
                    defaultTrigger.comparatorHrid,
                    defaultTrigger.value
                );
                this.triggers.push(trigger);
            }
        }
    }
}

export default Consumable;
