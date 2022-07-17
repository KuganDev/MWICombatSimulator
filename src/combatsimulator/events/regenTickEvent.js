import CombatEvent from "./combatEvent";

class RegenTickEvent extends CombatEvent {
    static type = "regenTick";

    constructor(time, source) {
        super(RegenTickEvent.type, time);

        this.source = source;
    }
}

export default RegenTickEvent;
