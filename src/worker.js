import CombatSimulator from "./combatsimulator/combatSimulator";
import Player from "./combatsimulator/player";
import Zone from "./combatsimulator/zone";

onmessage = function (event) {
    switch (event.data.type) {
        case "start_simulation":
            let player = Player.createFromDTO(event.data.player);
            let zone = new Zone(event.data.zoneHrid);
            console.log(player);
            console.log(zone);
            let simulationTimeLimit = event.data.simulationTimeLimit;

            let combatSimulator = new CombatSimulator(player, zone);

            let simResult = combatSimulator.simulate(simulationTimeLimit);

            this.postMessage({ type: "simulation_result", simResult: simResult });
            break;
    }
};
