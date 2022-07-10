import Equipment from "./combatsimulator/equipment.js";
import Monster from "./combatsimulator/monster.js";
import Player from "./combatsimulator/player.js";

let button = document.querySelector("#button1");
let input = document.querySelector("#input1");

let worker = new Worker(new URL("worker.js", import.meta.url));

button.onclick = function () {
    worker.postMessage(input.value);
};

worker.onmessage = function (event) {
    window.alert(event.data);
};

let player = new Player();
player.staminaLevel = 70;
player.intelligenceLevel = 67;
player.attackLevel = 72;
player.powerLevel = 70;
player.defenseLevel = 70;
player.equipment["/equipment_types/helm"] = new Equipment("/items/crimson_helmet", 3);
player.equipment["/equipment_types/body"] = new Equipment("/items/crimson_plate_body", 3);
player.equipment["/equipment_types/legs"] = new Equipment("/items/crimson_plate_legs", 3);
player.equipment["/equipment_types/feet"] = new Equipment("/items/crimson_boots", 3);
player.equipment["/equipment_types/hands"] = new Equipment("/items/pincer_gloves", 0);
player.equipment["/equipment_types/main_hand"] = new Equipment("/items/crimson_spear", 3);
player.equipment["/equipment_types/off_hand"] = new Equipment("/items/azure_buckler", 0);
player.equipment["/equipment_types/pouch"] = new Equipment("/items/large_pouch", 0);

player.updateCombatStats();
console.log("Player:", player);

let monster = new Monster("/combat_monsters/alligator");
monster.updateCombatStats();
console.log("Monster:", monster);