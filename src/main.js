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
import combatTriggerDependencyDetailMap from "./combatsimulator/data/combatTriggerDependencyDetailMap.json";
import combatTriggerConditionDetailMap from "./combatsimulator/data/combatTriggerConditionDetailMap.json";
import combatTriggerComparatorDetailMap from "./combatsimulator/data/combatTriggerComparatorDetailMap.json";
import abilitySlotsLevelRequirementList from "./combatsimulator/data/abilitySlotsLevelRequirementList.json";

let buttonStartSimulation = document.getElementById("buttonStartSimulation");

let worker = new Worker(new URL("worker.js", import.meta.url));

let player = new Player();
let food = [null, null, null];
let drinks = [null, null, null];
let abilities = [null, null, null, null];
let triggerMap = {};
let modalTriggers = [];

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
    });
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
    let equipment = new Equipment(gameItem.hrid, Number(enhancementLevel));
    player.equipment[equipmentType] = equipment;
    updatePlayerStats();
}

function enhancementLevelInputHandler(event, type) {
    let equipmentType = "/equipment_types/" + type;

    if (!player.equipment[equipmentType]) {
        return;
    }

    let equipment = new Equipment(player.equipment[equipmentType].hrid, Number(event.target.value));
    player.equipment[equipmentType] = equipment;
    updatePlayerStats();
}

// #endregion

// #region Level

function initLevelSection() {
    ["stamina", "intelligence", "attack", "power", "defense"].forEach((skill) => {
        let element = document.getElementById("inputLevel_" + skill);
        element.addEventListener("change", (event) => {
            levelInputHandler(event, skill);
        });
    });
}

function levelInputHandler(event, skill) {
    player[skill + "Level"] = Number(event.target.value);
    updatePlayerStats();
}

// #endregion

// #region Food

function initFoodSection() {
    for (let i = 0; i < 3; i++) {
        let element = document.getElementById("selectFood_" + i);

        for (const value of Object.values(itemDetailMap).filter(
            (item) => item.categoryHrid == "/item_categories/food"
        )) {
            element.add(new Option(value.name, value.hrid));
        }

        element.addEventListener("change", (event) => foodSelectHandler(event, i));
    }

    updateAvailableFoodSlots();
}

function foodSelectHandler(event, index) {
    food[index] = event.target.value;

    let triggerButton = document.getElementById("buttonFoodTrigger_" + index);
    triggerButton.disabled = !food[index];

    if (food[index] && !triggerMap[food[index]]) {
        let gameItem = itemDetailMap[food[index]];
        triggerMap[food[index]] = structuredClone(gameItem.consumableDetail.defaultCombatTriggers);
    }
}

function updateAvailableFoodSlots() {
    for (let i = 0; i < 3; i++) {
        let selectElement = document.getElementById("selectFood_" + i);
        let triggerButton = document.getElementById("buttonFoodTrigger_" + i);

        selectElement.disabled = i >= player.combatStats.foodSlots;
        triggerButton.disabled = i >= player.combatStats.foodSlots || !food[i];
    }
}

// #endregion

// #region Drinks

function initDrinksSection() {
    for (let i = 0; i < 3; i++) {
        let element = document.getElementById("selectDrink_" + i);

        for (const value of Object.values(itemDetailMap).filter(
            (item) => item.categoryHrid == "/item_categories/drink"
        )) {
            element.add(new Option(value.name, value.hrid));
        }

        element.addEventListener("change", (event) => drinkSelectHandler(event, i));
    }

    updateAvailableDrinkSlots();
}

function drinkSelectHandler(event, index) {
    drinks[index] = event.target.value;

    let triggerButton = document.getElementById("buttonDrinkTrigger_" + index);
    triggerButton.disabled = !drinks[index];

    if (drinks[index] && !triggerMap[drinks[index]]) {
        let gameItem = itemDetailMap[drinks[index]];
        triggerMap[drinks[index]] = structuredClone(gameItem.consumableDetail.defaultCombatTriggers);
    }
}

function updateAvailableDrinkSlots() {
    for (let i = 0; i < 3; i++) {
        let selectElement = document.getElementById("selectDrink_" + i);
        let triggerButton = document.getElementById("buttonDrinkTrigger_" + i);

        selectElement.disabled = i >= player.combatStats.drinkSlots;
        triggerButton.disabled = i >= player.combatStats.drinkSlots || !drinks[i];
    }
}

// #endregion

// #region Abilities

function initAbilitiesSection() {
    for (let i = 0; i < 4; i++) {
        let selectElement = document.getElementById("selectAbility_" + i);

        for (const value of Object.values(abilityDetailMap)) {
            selectElement.add(new Option(value.name, value.hrid));
        }

        selectElement.addEventListener("change", (event) => abilitySelectHandler(event, i));
    }

    updateAvailableAbilitySlots();
}

function abilitySelectHandler(event, index) {
    abilities[index] = event.target.value;

    let triggerButton = document.getElementById("buttonAbilityTrigger_" + index);
    triggerButton.disabled = !abilities[index];

    if (abilities[index] && !triggerMap[abilities[index]]) {
        let gameAbility = abilityDetailMap[abilities[index]];
        triggerMap[abilities[index]] = structuredClone(gameAbility.defaultCombatTriggers);
    }
}

function updateAvailableAbilitySlots() {
    for (let i = 0; i < 4; i++) {
        let selectElement = document.getElementById("selectAbility_" + i);
        let inputElement = document.getElementById("inputAbilityLevel_" + i);
        let triggerButton = document.getElementById("buttonAbilityTrigger_" + i);

        selectElement.disabled = player.intelligenceLevel < abilitySlotsLevelRequirementList[i + 1];
        inputElement.disabled = player.intelligenceLevel < abilitySlotsLevelRequirementList[i + 1];
        triggerButton.disabled = player.intelligenceLevel < abilitySlotsLevelRequirementList[i + 1] || !abilities[i];
    }
}

// #endregion

// #region Trigger

function initTriggerModal() {
    let modal = document.getElementById("triggerModal");
    modal.addEventListener("show.bs.modal", (event) => triggerModalShownHandler(event));

    let triggerSaveButton = document.getElementById("buttonTriggerModalSave");
    triggerSaveButton.addEventListener("click", (event) => triggerModalSaveHandler(event));

    let triggerAddButton = document.getElementById("buttonAddTrigger");
    triggerAddButton.addEventListener("click", (event) => triggerAddButtonHandler(event));

    let triggerDefaultButton = document.getElementById("buttonDefaultTrigger");
    triggerDefaultButton.addEventListener("click", (event) => triggerDefaultButtonHandler(event));

    for (let i = 0; i < 4; i++) {
        let triggerDependencySelect = document.getElementById("selectTriggerDependency_" + i);
        let triggerConditionSelect = document.getElementById("selectTriggerCondition_" + i);
        let triggerComparatorSelect = document.getElementById("selectTriggerComparator_" + i);
        let triggerValueInput = document.getElementById("inputTriggerValue_" + i);
        let triggerRemoveButton = document.getElementById("buttonRemoveTrigger_" + i);

        triggerDependencySelect.addEventListener("change", (event) => triggerDependencySelectHandler(event, i));
        triggerConditionSelect.addEventListener("change", (event) => triggerConditionSelectHandler(event, i));
        triggerComparatorSelect.addEventListener("change", (event) => triggerComparatorSelectHander(event, i));
        triggerValueInput.addEventListener("change", (event) => triggerValueInputHandler(event, i));
        triggerRemoveButton.addEventListener("click", (event) => triggerRemoveButtonHandler(event, i));
    }
}

function triggerModalShownHandler(event) {
    let triggerButton = event.relatedTarget;

    let triggerType = triggerButton.getAttribute("data-bs-triggertype");
    let triggerIndex = Number(triggerButton.getAttribute("data-bs-triggerindex"));

    let triggerTarget;
    switch (triggerType) {
        case "food":
            triggerTarget = food[triggerIndex];
            break;
        case "drink":
            triggerTarget = drinks[triggerIndex];
            break;
        case "ability":
            triggerTarget = abilities[triggerIndex];
            break;
    }

    let triggerTargetnput = document.getElementById("inputModalTriggerTarget");
    triggerTargetnput.value = triggerTarget;
    modalTriggers = triggerMap[triggerTarget];
    updateTriggerModal();
}

function triggerModalSaveHandler(event) {
    let triggerTargetnput = document.getElementById("inputModalTriggerTarget");
    let triggerTarget = triggerTargetnput.value;

    triggerMap[triggerTarget] = modalTriggers;
}

function triggerDependencySelectHandler(event, index) {
    modalTriggers[index].dependencyHrid = event.target.value;
    modalTriggers[index].conditionHrid = "";
    modalTriggers[index].comparatorHrid = "";
    modalTriggers[index].value = 0;

    updateTriggerModal();
}

function triggerConditionSelectHandler(event, index) {
    modalTriggers[index].conditionHrid = event.target.value;
    modalTriggers[index].comparatorHrid = "";
    modalTriggers[index].value = 0;

    updateTriggerModal();
}

function triggerComparatorSelectHander(event, index) {
    modalTriggers[index].comparatorHrid = event.target.value;

    updateTriggerModal();
}

function triggerValueInputHandler(event, index) {
    modalTriggers[index].value = Number(event.target.value);

    updateTriggerModal();
}

function triggerRemoveButtonHandler(event, index) {
    modalTriggers.splice(index, 1);

    updateTriggerModal();
}

function triggerAddButtonHandler(event) {
    if (modalTriggers.length == 4) {
        return;
    }

    modalTriggers.push({
        dependencyHrid: "",
        conditionHrid: "",
        comparatorHrid: "",
        value: 0,
    });

    updateTriggerModal();
}

function triggerDefaultButtonHandler(event) {
    let triggerTargetnput = document.getElementById("inputModalTriggerTarget");
    let triggerTarget = triggerTargetnput.value;

    if (triggerTarget.startsWith("/items/")) {
        modalTriggers = structuredClone(itemDetailMap[triggerTarget].consumableDetail.defaultCombatTriggers);
    } else {
        modalTriggers = structuredClone(abilityDetailMap[triggerTarget].defaultCombatTriggers);
    }

    updateTriggerModal();
}

function updateTriggerModal() {
    let triggerStartTextElement = document.getElementById("triggerStartText");
    if (modalTriggers.length == 0) {
        triggerStartTextElement.innerHTML = "Activate as soon as it's off cooldown";
    } else {
        triggerStartTextElement.innerHTML = "Activate when:";
    }

    let triggerAddButton = document.getElementById("buttonAddTrigger");
    triggerAddButton.disabled = modalTriggers.length == 4;

    let triggersValid = true;

    for (let i = 0; i < 4; i++) {
        let triggerElement = document.getElementById("modalTrigger_" + i);

        if (!modalTriggers[i]) {
            hideElement(triggerElement);
            continue;
        }

        showElement(triggerElement);

        let triggerDependencySelect = document.getElementById("selectTriggerDependency_" + i);
        let triggerConditionSelect = document.getElementById("selectTriggerCondition_" + i);
        let triggerComparatorSelect = document.getElementById("selectTriggerComparator_" + i);
        let triggerValueInput = document.getElementById("inputTriggerValue_" + i);

        showElement(triggerDependencySelect);
        fillTriggerDependencySelect(triggerDependencySelect);

        if (modalTriggers[i].dependencyHrid == "") {
            hideElement(triggerConditionSelect);
            hideElement(triggerComparatorSelect);
            hideElement(triggerValueInput);
            triggersValid = false;
            continue;
        }

        triggerDependencySelect.value = modalTriggers[i].dependencyHrid;
        showElement(triggerConditionSelect);
        fillTriggerConditionSelect(triggerConditionSelect, modalTriggers[i].dependencyHrid);

        if (modalTriggers[i].conditionHrid == "") {
            hideElement(triggerComparatorSelect);
            hideElement(triggerValueInput);
            triggersValid = false;
            continue;
        }

        triggerConditionSelect.value = modalTriggers[i].conditionHrid;
        showElement(triggerComparatorSelect);
        fillTriggerComparatorSelect(triggerComparatorSelect, modalTriggers[i].conditionHrid);

        if (modalTriggers[i].comparatorHrid == "") {
            hideElement(triggerValueInput);
            triggersValid = false;
            continue;
        }

        triggerComparatorSelect.value = modalTriggers[i].comparatorHrid;

        if (combatTriggerComparatorDetailMap[modalTriggers[i].comparatorHrid].allowValue) {
            showElement(triggerValueInput);
            triggerValueInput.value = modalTriggers[i].value;
        } else {
            hideElement(triggerValueInput);
        }
    }

    let triggerSaveButton = document.getElementById("buttonTriggerModalSave");
    triggerSaveButton.disabled = !triggersValid;
}

function fillTriggerDependencySelect(element) {
    element.length = 0;
    element.add(new Option("", ""));

    for (const dependency of Object.values(combatTriggerDependencyDetailMap).sort(
        (a, b) => a.sortIndex - b.sortIndex
    )) {
        element.add(new Option(dependency.name, dependency.hrid));
    }
}

function fillTriggerConditionSelect(element, dependencyHrid) {
    let dependency = combatTriggerDependencyDetailMap[dependencyHrid];

    let conditions;
    if (dependency.isSingleTarget) {
        conditions = Object.values(combatTriggerConditionDetailMap).filter((condition) => condition.isSingleTarget);
    } else {
        conditions = Object.values(combatTriggerConditionDetailMap).filter((condition) => condition.isMultiTarget);
    }

    element.length = 0;
    element.add(new Option("", ""));

    for (const condition of Object.values(conditions).sort((a, b) => a.sortIndex - b.sortIndex)) {
        element.add(new Option(condition.name, condition.hrid));
    }
}

function fillTriggerComparatorSelect(element, conditionHrid) {
    let condition = combatTriggerConditionDetailMap[conditionHrid];

    let comparators = condition.allowedComparatorHrids.map((hrid) => combatTriggerComparatorDetailMap[hrid]);

    element.length = 0;
    element.add(new Option("", ""));

    for (const comparator of Object.values(comparators).sort((a, b) => a.sortIndex - b.sortIndex)) {
        element.add(new Option(comparator.name, comparator.hrid));
    }
}

function hideElement(element) {
    element.classList.remove("d-flex");
    element.classList.add("d-none");
}

function showElement(element) {
    element.classList.remove("d-none");
    element.classList.add("d-flex");
}

// #endregion

function updatePlayerStats() {
    player.updateCombatStats();

    [
        "maxHitpoints",
        "maxManapoints",
        "stabAccuracyRating",
        "stabMaxDamage",
        "slashAccuracyRating",
        "slashMaxDamage",
        "smashAccuracyRating",
        "smashMaxDamage",
        "stabEvasionRating",
        "slashEvasionRating",
        "smashEvasionRating",
        "armor",
    ].forEach((stat) => {
        let element = document.getElementById("combatStat_" + stat);
        element.innerHTML = Math.floor(player.combatStats[stat]);
    });

    let combatStyleElement = document.getElementById("combatStat_combatStyleHrid");
    let combatStyle = player.combatStats.combatStyleHrid;
    combatStyleElement.innerHTML = combatStyle.charAt(0).toUpperCase() + combatStyle.slice(1);

    let attackIntervalElement = document.getElementById("combatStat_attackInterval");
    attackIntervalElement.innerHTML = (player.combatStats.attackInterval / 1e9).toLocaleString() + "s";

    ["lifeSteal", "HPRegen", "MPRegen"].forEach((stat) => {
        let element = document.getElementById("combatStat_" + stat);
        let value = (100 * player.combatStats[stat]).toLocaleString([], {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
        element.innerHTML = value + "%";
    });

    updateAvailableFoodSlots();
    updateAvailableDrinkSlots();
    updateAvailableAbilitySlots();
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

updatePlayerStats();

initEquipmentSection();
initLevelSection();
initFoodSection();
initDrinksSection();
initAbilitiesSection();
initTriggerModal();
