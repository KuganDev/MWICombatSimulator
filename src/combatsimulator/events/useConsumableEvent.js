import CombatEvent from "./combatEvent";

class UseConsumableEvent extends CombatEvent {
    static type = "useConsumable";

    constructor(time, source, consumable) {
        super(UseConsumableEvent.type, time);

        this.source = source;
        this.consumable = consumable;
    }
}

export default UseConsumableEvent;
