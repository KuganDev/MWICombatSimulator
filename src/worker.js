import Player from "./combatsimulator/player";


onmessage = function (event) {
    console.log(event.data.player);
    let player = Player.createFromDTO(event.data.player);
    player.updateCombatStats();
    console.log(player);
};
