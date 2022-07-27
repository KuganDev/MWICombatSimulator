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

let buttonStartSimulation = document.getElementById("buttonStartSimulation");

let worker = new Worker(new URL("worker.js", import.meta.url));

let player = new Player();

buttonStartSimulation.onclick = function () {
    startSimulation();
};

worker.onmessage = function (event) {
    switch (event.data.type) {
        case "simulation_result":
            printSimResult(event.data.simResult);
            break;
    }
};

// #region Equipment

function initEquipmentSection() {
    ["head", "body", "legs", "feet", "hands", "main_hand", "two_hand", "off_hand", "pouch"].forEach((type) => {
        initEquipmentSelect(type);
        initEnhancementLevelInput(type);
    });
}

function initEquipmentSelect(equipmentType) {
    let selectId = "selectEquipment_";
    if (equipmentType == "main_hand" || equipmentType == "two_hand") {
        selectId += "weapon";
    } else {
        selectId += equipmentType;
    }
    let selectElement = document.getElementById(selectId);

    for (const value of Object.values(itemDetailMap)
        .filter((item) => item.categoryHrid == "/item_categories/equipment")
        .filter((item) => item.equipmentDetail.type == "/equipment_types/" + equipmentType)) {
        selectElement.add(new Option(value.name, value.hrid));
    }

    selectElement.addEventListener("change", (event) => {
        equipmentSelectHandler(event, equipmentType);
    });
}

function initEnhancementLevelInput(equipmentType) {
    let inputId = "inputEquipmentEnhancementLevel_";
    if (equipmentType == "main_hand" || equipmentType == "two_hand") {
        inputId += "weapon";
    } else {
        inputId += equipmentType;
    }

    let inputElement = document.getElementById(inputId);
    inputElement.addEventListener("change", (event) => {
        enhancementLevelInputHandler(event, equipmentType);
    })
}

function equipmentSelectHandler(event, type) {
    let equipmentType = "/equipment_types/" + type;

    if (!event.target.value) {
        player.equipment[equipmentType] = null;
        updatePlayerStats();
        return;
    }

    let gameItem = itemDetailMap[event.target.value];

    // Weapon select has two handlers because of mainhand and twohand weapons. Ignore the handler with the wrong type
    if (gameItem.equipmentDetail.type != equipmentType) {
        return;
    }

    if (type == "two_hand") {
        player.equipment["/equipment_types/main_hand"] = null;
        player.equipment["/equipment_types/off_hand"] = null;
        document.getElementById("selectEquipment_off_hand").value = "";
        document.getElementById("inputEquipmentEnhancementLevel_off_hand").value = 0;
    }
    if (type == "off_hand" && player.equipment["/equipment_types/two_hand"]) {
        player.equipment["/equipment_types/two_hand"] = null;
        document.getElementById("selectEquipment_weapon").value = "";
        document.getElementById("inputEquipmentEnhancementLevel_weapon").value = 0;
    }

    let selectType = type;
    if (type == "main_hand" || type == "two_hand") {
        selectType = "weapon";
    }

    let enhancementLevel = document.getElementById("inputEquipmentEnhancementLevel_" + selectType).value;
    let equipment = new Equipment(gameItem.hrid, enhancementLevel);
    player.equipment[equipmentType] = equipment;
    updatePlayerStats();
}

function enhancementLevelInputHandler(event, type) {
    let equipmentType = "/equipment_types/" + type;

    if (!player.equipment[equipmentType]) {
        return;
    }

    let equipment = new Equipment(player.equipment[equipmentType].hrid, event.target.value);
    player.equipment[equipmentType] = equipment;
    updatePlayerStats();
}

// #endregion

function updatePlayerStats() {
    player.updateCombatStats();

    console.log(player);
}

function startSimulation() {
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

    let zone = new Zone("/actions/combat/gobo_planet");

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

    let simulationTimeLimit = 100 * 60 * 60 * 1e9;

    let workerMessage = {
        type: "start_simulation",
        player: player,
        zoneHrid: "/actions/combat/gobo_planet",
        simulationTimeLimit: simulationTimeLimit,
    };

    worker.postMessage(workerMessage);
}

function printSimResult(simResult) {
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
                let misses = attacks["miss"] ?? 0;
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
}

initEquipmentSection();
