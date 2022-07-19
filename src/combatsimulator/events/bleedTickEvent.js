import CombatEvent from "./combatEvent";

class BleedTickEvent extends CombatEvent {
    static type = "bleedTick";

    constructor(time, target, damage, totalTicks, currentTick) {
        super(BleedTickEvent.type, time);

        this.target = target;
        this.damage = damage;
        this.totalTicks = totalTicks;
        this.currentTick = currentTick;
    }
}

export default BleedTickEvent;
