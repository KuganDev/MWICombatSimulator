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
import actionDetailMap from "./combatsimulator/data/actionDetailMap.json";
import combatMonsterDetailMap from "./combatsimulator/data/combatMonsterDetailMap.json";

const ONE_SECOND = 1e9;
const ONE_HOUR = 60 * 60 * ONE_SECOND;

let buttonStartSimulation = document.getElementById("buttonStartSimulation");

let worker = new Worker(new URL("worker.js", import.meta.url));

let player = new Player();
let food = [null, null, null];
let drinks = [null, null, null];
let abilities = [null, null, null, null];
let triggerMap = {};
let modalTriggers = [];

buttonStartSimulation.onclick = function () {
    let invalidElements = document.querySelectorAll(":invalid");
    if (invalidElements.length > 0) {
        invalidElements.forEach((element) => element.reportValidity());
        return;
    }
    startSimulation();
};

worker.onmessage = function (event) {
    switch (event.data.type) {
        case "simulation_result":
            showSimulationResult(event.data.simResult);
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

    let gameEquipment = Object.values(itemDetailMap)
        .filter((item) => item.categoryHrid == "/item_categories/equipment")
        .filter((item) => item.equipmentDetail.type == "/equipment_types/" + equipmentType)
        .sort((a, b) => a.sortIndex - b.sortIndex);

    for (const equipment of Object.values(gameEquipment)) {
        selectElement.add(new Option(equipment.name, equipment.hrid));
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

        let gameFoods = Object.values(itemDetailMap)
            .filter((item) => item.categoryHrid == "/item_categories/food")
            .sort((a, b) => a.sortIndex - b.sortIndex);

        for (const food of Object.values(gameFoods)) {
            element.add(new Option(food.name, food.hrid));
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

        let gameDrinks = Object.values(itemDetailMap)
            .filter((item) => item.categoryHrid == "/item_categories/drink")
            .filter((item) => item.consumableDetail.usableInActionTypeMap["/action_types/combat"])
            .sort((a, b) => a.sortIndex - b.sortIndex);

        for (const drink of Object.values(gameDrinks)) {
            element.add(new Option(drink.name, drink.hrid));
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

        let gameAbilities = Object.values(abilityDetailMap).sort((a, b) => a.sortIndex - b.sortIndex);

        for (const ability of Object.values(gameAbilities)) {
            selectElement.add(new Option(ability.name, ability.hrid));
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

// #region Zones

function initZones() {
    let zoneSelect = document.getElementById("selectZone");

    let gameZones = Object.values(actionDetailMap)
        .filter((action) => action.type == "/action_types/combat")
        .sort((a, b) => a.sortIndex - b.sortIndex);

    for (const zone of Object.values(gameZones)) {
        zoneSelect.add(new Option(zone.name, zone.hrid));
    }
}

// #endregion

// #region Simulation Result

function showSimulationResult(simResult) {
    showKills(simResult);
    showDeaths(simResult);
    showExperienceGained(simResult);
    showConsumablesUsed(simResult);
    showHitpointsGained(simResult);
    showManapointsGained(simResult);
    showDamageDone(simResult);
    showDamageTaken(simResult);
}

function showKills(simResult) {
    let resultDiv = document.getElementById("simulationResultKills");
    let newChildren = [];

    let hoursSimulated = simResult.simulatedTime / ONE_HOUR;
    let playerDeaths = simResult.deaths["player"] ?? 0;
    let encountersPerHour = ((simResult.encounters - playerDeaths) / hoursSimulated).toFixed(1);

    let encountersRow = createRow(["col-md-6", "col-md-6 text-end"], ["Encounters", encountersPerHour]);
    newChildren.push(encountersRow);

    let monsters = Object.keys(simResult.deaths)
        .filter((enemy) => enemy != "player")
        .sort();

    for (const monster of monsters) {
        let killsPerHour = (simResult.deaths[monster] / hoursSimulated).toFixed(1);
        let monsterRow = createRow(
            ["col-md-6", "col-md-6 text-end"],
            [combatMonsterDetailMap[monster].name, killsPerHour]
        );
        newChildren.push(monsterRow);
    }

    resultDiv.replaceChildren(...newChildren);
}

function showDeaths(simResult) {
    let resultDiv = document.getElementById("simulationResultPlayerDeaths");

    let hoursSimulated = simResult.simulatedTime / ONE_HOUR;
    let playerDeaths = simResult.deaths["player"] ?? 0;
    let deathsPerHour = (playerDeaths / hoursSimulated).toFixed(2);

    let deathRow = createRow(["col-md-6", "col-md-6 text-end"], ["Player", deathsPerHour]);
    resultDiv.replaceChildren(deathRow);
}

function showExperienceGained(simResult) {
    let resultDiv = document.getElementById("simulationResultExperienceGain");
    let newChildren = [];

    let hoursSimulated = simResult.simulatedTime / ONE_HOUR;

    let totalExperience = Object.values(simResult.experienceGained["player"]).reduce((prev, cur) => prev + cur, 0);
    let totalExperiencePerHour = (totalExperience / hoursSimulated).toFixed(0);
    let totalRow = createRow(["col-md-6", "col-md-6 text-end"], ["Total", totalExperiencePerHour]);
    newChildren.push(totalRow);

    ["Stamina", "Intelligence", "Attack", "Power", "Defense"].forEach((skill) => {
        let experience = simResult.experienceGained["player"][skill.toLowerCase()] ?? 0;
        let experiencePerHour = (experience / hoursSimulated).toFixed(0);
        let experienceRow = createRow(["col-md-6", "col-md-6 text-end"], [skill, experiencePerHour]);
        newChildren.push(experienceRow);
    });

    resultDiv.replaceChildren(...newChildren);
}

function showConsumablesUsed(simResult) {
    let resultDiv = document.getElementById("simulationResultConsumablesUsed");
    let newChildren = [];

    let hoursSimulated = simResult.simulatedTime / ONE_HOUR;

    if (!simResult.consumablesUsed["player"]) {
        resultDiv.replaceChildren(...newChildren);
        return;
    }

    let consumablesUsed = Object.entries(simResult.consumablesUsed["player"]).sort((a, b) => b[1] - a[1]);

    for (const [consumable, amount] of consumablesUsed) {
        let consumablesPerHour = (amount / hoursSimulated).toFixed(0);
        let consumableRow = createRow(
            ["col-md-6", "col-md-6 text-end"],
            [itemDetailMap[consumable].name, consumablesPerHour]
        );
        newChildren.push(consumableRow);
    }

    resultDiv.replaceChildren(...newChildren);
}

function showHitpointsGained(simResult) {
    let resultDiv = document.getElementById("simulationResultHealthRestored");
    let newChildren = [];

    let secondsSimulated = simResult.simulatedTime / ONE_SECOND;

    if (!simResult.hitpointsGained["player"]) {
        resultDiv.replaceChildren(...newChildren);
        return;
    }

    let hitpointsGained = Object.entries(simResult.hitpointsGained["player"]).sort((a, b) => b[1] - a[1]);

    let totalHitpointsGained = hitpointsGained.reduce((prev, cur) => prev + cur[1], 0);
    let totalHitpointsPerSecond = (totalHitpointsGained / secondsSimulated).toFixed(2);
    let totalRow = createRow(
        ["col-md-6", "col-md-3 text-end", "col-md-3 text-end"],
        ["Total", totalHitpointsPerSecond, "100%"]
    );
    newChildren.push(totalRow);

    for (const [source, amount] of hitpointsGained) {
        if (amount == 0) {
            continue;
        }

        let sourceText;
        switch (source) {
            case "regen":
                sourceText = "Regen";
                break;
            case "lifesteal":
                sourceText = "Life Steal";
                break;
            default:
                sourceText = itemDetailMap[source].name;
                break;
        }
        let hitpointsPerSecond = (amount / secondsSimulated).toFixed(2);
        let percentage = ((100 * amount) / totalHitpointsGained).toFixed(0);

        let row = createRow(
            ["col-md-6", "col-md-3 text-end", "col-md-3 text-end"],
            [sourceText, hitpointsPerSecond, percentage + "%"]
        );
        newChildren.push(row);
    }

    resultDiv.replaceChildren(...newChildren);
}

function showManapointsGained(simResult) {
    let resultDiv = document.getElementById("simulationResultManaRestored");
    let newChildren = [];

    let secondsSimulated = simResult.simulatedTime / ONE_SECOND;

    if (!simResult.manapointsGained["player"]) {
        resultDiv.replaceChildren(...newChildren);
        return;
    }

    let manapointsGained = Object.entries(simResult.manapointsGained["player"]).sort((a, b) => b[1] - a[1]);

    let totalManapointsGained = manapointsGained.reduce((prev, cur) => prev + cur[1], 0);
    let totalManapointsPerSecond = (totalManapointsGained / secondsSimulated).toFixed(2);
    let totalRow = createRow(
        ["col-md-6", "col-md-3 text-end", "col-md-3 text-end"],
        ["Total", totalManapointsPerSecond, "100%"]
    );
    newChildren.push(totalRow);

    for (const [source, amount] of manapointsGained) {
        if (amount == 0) {
            continue;
        }

        let sourceText;
        switch (source) {
            case "regen":
                sourceText = "Regen";
                break;
            default:
                sourceText = itemDetailMap[source].name;
                break;
        }
        let manapointsPerSecond = (amount / secondsSimulated).toFixed(2);
        let percentage = ((100 * amount) / totalManapointsGained).toFixed(0);

        let row = createRow(
            ["col-md-6", "col-md-3 text-end", "col-md-3 text-end"],
            [sourceText, manapointsPerSecond, percentage + "%"]
        );
        newChildren.push(row);
    }

    let ranOutOfManaText = simResult.playerRanOutOfMana ? "Yes" : "No";
    let ranOutOfManaRow = createRow(["col-md-6", "col-md-6 text-end"], ["Ran out of mana", ranOutOfManaText]);
    newChildren.push(ranOutOfManaRow);

    resultDiv.replaceChildren(...newChildren);
}

function showDamageDone(simResult) {
    let totalDamageDone = {};
    let enemyIndex = 1;

    let secondsSimulated = simResult.simulatedTime / ONE_SECOND;

    for (let i = 1; i < 5; i++) {
        let accordion = document.getElementById("simulationResultDamageDoneAccordionEnemy" + i);
        hideElement(accordion);
    }

    for (const [target, abilities] of Object.entries(simResult.attacks["player"])) {
        let targetDamageDone = {};

        for (const [ability, abilityCasts] of Object.entries(abilities)) {
            let casts = Object.values(abilityCasts).reduce((prev, cur) => prev + cur, 0);
            let misses = abilityCasts["miss"] ?? 0;
            let damage = Object.entries(abilityCasts)
                .filter((entry) => entry[0] != "miss")
                .reduce((prev, cur) => prev + Number(cur[0]) * cur[1], 0);

            targetDamageDone[ability] = {
                casts,
                misses,
                damage,
            };
            if (totalDamageDone[ability]) {
                totalDamageDone[ability].casts += casts;
                totalDamageDone[ability].misses += misses;
                totalDamageDone[ability].damage += damage;
            } else {
                totalDamageDone[ability] = {
                    casts,
                    misses,
                    damage,
                };
            }
        }

        let resultDiv = document.getElementById("simulationResultDamageDoneEnemy" + enemyIndex);
        createDamageTable(resultDiv, targetDamageDone, secondsSimulated);

        let resultAccordion = document.getElementById("simulationResultDamageDoneAccordionEnemy" + enemyIndex);
        showElement(resultAccordion);

        let resultAccordionButton = document.getElementById(
            "buttonSimulationResultDamageDoneAccordionEnemy" + enemyIndex
        );
        let targetName = combatMonsterDetailMap[target].name;
        resultAccordionButton.innerHTML = "<b>Damage Done (" + targetName + ")</b>";

        enemyIndex++;
    }

    let totalResultDiv = document.getElementById("simulationResultTotalDamageDone");
    createDamageTable(totalResultDiv, totalDamageDone, secondsSimulated);
}

function showDamageTaken(simResult) {
    let totalDamageTaken = {};
    let enemyIndex = 1;

    let secondsSimulated = simResult.simulatedTime / ONE_SECOND;

    for (let i = 1; i < 5; i++) {
        let accordion = document.getElementById("simulationResultDamageTakenAccordionEnemy" + i);
        hideElement(accordion);
    }

    for (const [source, targets] of Object.entries(simResult.attacks)) {
        if (source == "player") {
            continue;
        }

        let sourceDamageTaken = {};

        for (const [ability, abilityCasts] of Object.entries(targets["player"])) {
            let casts = Object.values(abilityCasts).reduce((prev, cur) => prev + cur, 0);
            let misses = abilityCasts["miss"] ?? 0;
            let damage = Object.entries(abilityCasts)
                .filter((entry) => entry[0] != "miss")
                .reduce((prev, cur) => prev + Number(cur[0]) * cur[1], 0);

            sourceDamageTaken[ability] = {
                casts,
                misses,
                damage,
            };
            if (totalDamageTaken[ability]) {
                totalDamageTaken[ability].casts += casts;
                totalDamageTaken[ability].misses += misses;
                totalDamageTaken[ability].damage += damage;
            } else {
                totalDamageTaken[ability] = {
                    casts,
                    misses,
                    damage,
                };
            }
        }

        let resultDiv = document.getElementById("simulationResultDamageTakenEnemy" + enemyIndex);
        createDamageTable(resultDiv, sourceDamageTaken, secondsSimulated);

        let resultAccordion = document.getElementById("simulationResultDamageTakenAccordionEnemy" + enemyIndex);
        showElement(resultAccordion);

        let resultAccordionButton = document.getElementById(
            "buttonSimulationResultDamageTakenAccordionEnemy" + enemyIndex
        );
        let sourceName = combatMonsterDetailMap[source].name;
        resultAccordionButton.innerHTML = "<b>Damage Done (" + sourceName + ")</b>";

        enemyIndex++;
    }

    let totalResultDiv = document.getElementById("simulationResultTotalDamageTaken");
    createDamageTable(totalResultDiv, totalDamageTaken, secondsSimulated);
}

function createDamageTable(resultDiv, damageDone, secondsSimulated) {
    let newChildren = [];

    let sortedDamageDone = Object.entries(damageDone).sort((a, b) => b[1].damage - a[1].damage);

    let totalCasts = sortedDamageDone.reduce((prev, cur) => prev + cur[1].casts, 0);
    let totalMisses = sortedDamageDone.reduce((prev, cur) => prev + cur[1].misses, 0);
    let totalDamage = sortedDamageDone.reduce((prev, cur) => prev + cur[1].damage, 0);
    let totalHitChance = ((100 * (totalCasts - totalMisses)) / totalCasts).toFixed(1);
    let totalDamagePerSecond = (totalDamage / secondsSimulated).toFixed(2);

    let totalRow = createRow(
        ["col-md-5", "col-md-3 text-end", "col-md-2 text-end", "col-md-2 text-end"],
        ["Total", totalHitChance + "%", totalDamagePerSecond, "100%"]
    );
    newChildren.push(totalRow);

    for (const [ability, damageInfo] of sortedDamageDone) {
        let abilityText;
        switch (ability) {
            case "autoAttack":
                abilityText = "Auto Attack";
                break;
            case "bleed":
                abilityText = "Bleed";
                break;
            default:
                abilityText = abilityDetailMap[ability].name;
                break;
        }

        let hitChance = ((100 * (damageInfo.casts - damageInfo.misses)) / damageInfo.casts).toFixed(1);
        let damagePerSecond = (damageInfo.damage / secondsSimulated).toFixed(2);
        let percentage = ((100 * damageInfo.damage) / totalDamage).toFixed(0);

        let row = createRow(
            ["col-md-5", "col-md-3 text-end", "col-md-2 text-end", "col-md-2 text-end"],
            [abilityText, hitChance + "%", damagePerSecond, percentage + "%"]
        );
        newChildren.push(row);
    }

    resultDiv.replaceChildren(...newChildren);
}

function createRow(columnClassNames, columnValues) {
    let row = createElement("div", "row");

    for (let i = 0; i < columnClassNames.length; i++) {
        let column = createElement("div", columnClassNames[i], columnValues[i]);
        row.appendChild(column);
    }

    return row;
}

function createElement(tagName, className, innerHTML = "") {
    let element = document.createElement(tagName);
    element.className = className;
    element.innerHTML = innerHTML;

    return element;
}

function printSimResult(simResult) {
    console.log(simResult);
    return;

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

// #endregion

function startSimulation() {
    for (let i = 0; i < 3; i++) {
        if (food[i]) {
            let consumable = new Consumable(food[i], triggerMap[food[i]]);
            player.food[i] = consumable;
        }
        if (drinks[i]) {
            let consumable = new Consumable(drinks[i], triggerMap[drinks[i]]);
            player.drinks[i] = consumable;
        }
    }

    for (let i = 0; i < 4; i++) {
        if (abilities[i]) {
            let abilityLevelInput = document.getElementById("inputAbilityLevel_" + i);
            let ability = new Ability(abilities[i], Number(abilityLevelInput.value), triggerMap[abilities[i]]);
            player.abilities[i] = ability;
        }
    }

    let zoneSelect = document.getElementById("selectZone");
    let simulationTimeInput = document.getElementById("inputSimulationTime");

    let simulationTimeLimit = Number(simulationTimeInput.value) * ONE_HOUR;

    let workerMessage = {
        type: "start_simulation",
        player: player,
        zoneHrid: zoneSelect.value,
        simulationTimeLimit: simulationTimeLimit,
    };

    worker.postMessage(workerMessage);
}

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

updatePlayerStats();

initEquipmentSection();
initLevelSection();
initFoodSection();
initDrinksSection();
initAbilitiesSection();
initZones();
initTriggerModal();
