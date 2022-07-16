import CombatEvent from "./combatEvent";

class AutoAttackEvent extends CombatEvent {
    static type = "autoAttack"
    constructor(time, source, target) {
        super(AutoAttackEvent.type, time);

        this.source = source;
        this.target = target;
    }
}

export default AutoAttackEvent;