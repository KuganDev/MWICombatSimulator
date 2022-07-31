import CombatSimulator from "./combatsimulator/combatSimulator";
import Player from "./combatsimulator/player";
import Zone from "./combatsimulator/zone";

onmessage = async function (event) {
    switch (event.data.type) {
        case "start_simulation":
            let player = Player.createFromDTO(event.data.player);
            let zone = new Zone(event.data.zoneHrid);
            let simulationTimeLimit = event.data.simulationTimeLimit;

            let combatSimulator = new CombatSimulator(player, zone);
            combatSimulator.addEventListener("progress", (event) => {
                this.postMessage({ type: "simulation_progress", progress: event.detail });
            });

            try {
                let simResult = await combatSimulator.simulate(simulationTimeLimit);
                this.postMessage({ type: "simulation_result", simResult: simResult });
            } catch (e) {
                this.postMessage({ type: "simulation_error", error: e });
            }
            break;
    }
};
