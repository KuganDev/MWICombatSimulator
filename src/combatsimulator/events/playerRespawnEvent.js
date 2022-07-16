import CombatEvent from "./combatEvent";

class PlayerRespawnEvent extends CombatEvent {
    static type = "playerRespawn";

    constructor(time) {
        super(PlayerRespawnEvent.type, time);
    }
}

export default PlayerRespawnEvent;
