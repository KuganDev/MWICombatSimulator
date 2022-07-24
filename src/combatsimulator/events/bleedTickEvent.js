import CombatEvent from "./combatEvent";

class BleedTickEvent extends CombatEvent {
    static type = "bleedTick";

    constructor(time, sourceRef, target, damage, totalTicks, currentTick) {
        super(BleedTickEvent.type, time);

        // Calling it 'source' would wrongly clear bleeds when the source dies
        this.sourceRef = sourceRef;
        this.target = target;
        this.damage = damage;
        this.totalTicks = totalTicks;
        this.currentTick = currentTick;
    }
}

export default BleedTickEvent;
