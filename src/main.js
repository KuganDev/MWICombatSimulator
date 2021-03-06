import Equipment from "./combatsimulator/equipment.js";
import Monster from "./combatsimulator/monster.js";
import Player from "./combatsimulator/player.js";
import Buff from "./combatsimulator/buff.js";
import abilityDetailMap from "./combatsimulator/data/abilityDetailMap.json";
import itemDetailMap from "./combatsimulator/data/itemDetailMap.json";
import Trigger from "./combatsimulator/trigger.js";
import Ability from "./combatsimulator/ability.js";
import Consumable from "./combatsimulator/consumable.js";
import Zone from "./combatsimulator/zone.js";
import CombatSimulator from "./combatsimulator/combatSimulator.js";

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
player.staminaLevel = 65;
player.intelligenceLevel = 69;
player.attackLevel = 71;
player.powerLevel = 69;
player.defenseLevel = 68;
player.equipment["/equipment_types/helm"] = new Equipment("/items/rainbow_helmet", 2);
player.equipment["/equipment_types/body"] = new Equipment("/items/rainbow_plate_body", 2);
player.equipment["/equipment_types/legs"] = new Equipment("/items/rainbow_plate_legs", 2);
player.equipment["/equipment_types/feet"] = new Equipment("/items/rainbow_boots", 2);
player.equipment["/equipment_types/hands"] = new Equipment("/items/rainbow_gauntlets", 2);
player.equipment["/equipment_types/main_hand"] = new Equipment("/items/gobo_smasher", 6);
// player.equipment["/equipment_types/off_hand"] = new Equipment("/items/rainbow_buckler", 2);
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
// player.addBuff(buff, currentTime);

let monster2 = new Monster("/combat_monsters/swampy");
let monster3 = new Monster("/combat_monsters/snake");
monster.reset();
monster2.reset();
monster3.reset();
monster2.combatStats.currentHitpoints -= 100;
monster3.combatStats.currentHitpoints -= 100;

let trigger = new Trigger(
    "/combat_trigger_dependencies/self",
    "/combat_trigger_conditions/missing_hp",
    "/combat_trigger_comparators/greater_than_equal",
    200
);
console.log(trigger.isActive(player, monster, [player], [monster, monster2, monster3]));

let zone = new Zone("/actions/combat/gobo_planet");
console.log(zone);

let counts = {};
let iterations = 100000;
for (let i = 0; i < iterations; i++) {
    let encounter = zone.getRandomEncounter();
    let encounterString = encounter.map((monster) => monster.hrid).join(" ");

    if (!counts[encounterString]) {
        counts[encounterString] = 0;
    }

    counts[encounterString] += 1;
}

for (const [key, value] of Object.entries(counts)) {
    console.log(key, value / iterations);
}

let ability1 = new Ability("/abilities/sweep", 12);
let ability2 = new Ability("/abilities/cleave", 1);
let ability3 = new Ability("/abilities/berserk", 13);

let trigger1 = new Trigger(
    "/combat_trigger_dependencies/self",
    "/combat_trigger_conditions/missing_hp",
    "/combat_trigger_comparators/greater_than_equal",
    400
);

let consumable1 = new Consumable("/items/mooberry_cake");
let consumable2 = new Consumable("/items/dragon_fruit_yogurt");
let consumable3 = new Consumable("/items/strawberry_cake");
let consumable4 = new Consumable("/items/power_coffee");
let consumable5 = new Consumable("/items/lucky_coffee");

player.food[0] = consumable1;
player.food[1] = consumable2;
player.food[2] = consumable3;
player.drinks[0] = consumable4;
player.drinks[1] = consumable5;
player.abilities[0] = ability1;
player.abilities[1] = ability2;
player.abilities[2] = ability3;

let simulator = new CombatSimulator(player, zone);
let simResult = simulator.simulate(100 * 60 * 60 * 1e9);

console.log(simResult);

console.log("Simulated hours:", simResult.simulatedTime / (60 * 60 * 1e9));

console.log("Encounters per hour:", simResult.encounters / (simResult.simulatedTime / (60 * 60 * 1e9)));

console.log("Deaths per hour:");
for (const [key, value] of Object.entries(simResult.deaths)) {
    console.log(key, value / (simResult.simulatedTime / (60 * 60 * 1e9)));
}

console.log("Experience per hour:");
for (const [key, value] of Object.entries(simResult.experienceGained["player"])) {
    console.log(key, value / (simResult.simulatedTime / (60 * 60 * 1e9)));
}

for (const [source, targets] of Object.entries(simResult.attacks)) {
    console.log("Attack stats for", source);
    for (const [target, abilities] of Object.entries(targets)) {
        console.log("   Against", target);
        for (const [ability, attacks] of Object.entries(abilities)) {
            console.log("       ", ability);
            let misses = attacks["miss"];
            let attempts = Object.values(attacks).reduce((prev, cur) => prev + cur);
            console.log("           Casts:", attempts);
            console.log("           Hitchance:", 1 - misses / attempts);
            let totalDamage = Object.entries(attacks)
                .filter(([key, value]) => key != "miss")
                .map(([key, value]) => key * value)
                .reduce((prev, cur) => prev + cur);
            console.log("           Average hit:", totalDamage / (attempts - misses));
        }
    }
}
