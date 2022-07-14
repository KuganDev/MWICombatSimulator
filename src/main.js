import Equipment from "./combatsimulator/equipment.js";
import Monster from "./combatsimulator/monster.js";
import Player from "./combatsimulator/player.js";
import Buff from "./combatsimulator/buff.js";
import abilityDetailMap from "./combatsimulator/data/abilityDetailMap.json";
import itemDetailMap from "./combatsimulator/data/itemDetailMap.json";
import Trigger from "./combatsimulator/trigger.js";
import Ability from "./combatsimulator/ability.js";
import Consumable from "./combatsimulator/consumable.js";

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

let buff = new Buff(abilityDetailMap["/abilities/vampirism"].abilityEffects[0].buff, 9);
// let buff = new Buff(itemDetailMap["/items/super_power_coffee"].consumableDetail.buffs[0]);

console.log("Buff:", buff);

let currentTime = 1000000000;
let stats = {};

Object.entries(player.combatStats).forEach(([key, value]) => {
    stats[key] = [value];
});

player.addBuff(buff, currentTime);
Object.entries(player.combatStats).forEach(([key, value]) => {
    stats[key].push(value);
});

player.removeExpiredBuffs(currentTime + buff.duration);
Object.entries(player.combatStats).forEach(([key, value]) => {
    stats[key].push(value);
});

console.table(stats);

player.reset();
player.addBuff(buff, currentTime);

let monster2 = new Monster("/combat_monsters/swampy");
let monster3 = new Monster("/combat_monsters/snake");
monster.reset();
monster2.reset();
monster3.reset();
monster2.combatStats.currentHitpoints -= 100;
monster3.combatStats.currentHitpoints -= 100;

let trigger = new Trigger(
    "/combat_trigger_dependencies/all_enemies",
    "/combat_trigger_conditions/missing_hp",
    "/combat_trigger_comparators/greater_than_equal",
    200
);
console.log(trigger.isActive(player, monster, [player], [monster, monster2, monster3]));

let ability1 = new Ability("/abilities/poke", 13);
let ability2 = new Ability("/abilities/berserk", 7, [trigger]);
console.log(ability1);
console.log(ability2);

let consumable1 = new Consumable("/items/stamina_coffee");
let consumable2 = new Consumable("/items/marsberry_cake", [trigger]);
let consumable3 = new Consumable("/items/plum_yogurt");

console.log(consumable1);
console.log(consumable2);
console.log(consumable3);
