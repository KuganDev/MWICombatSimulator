import CombatUtilities from "./combatUtilities";
import AutoAttackEvent from "./events/autoAttackEvent";
import BleedTickEvent from "./events/bleedTickEvent";
import CheckBuffExpirationEvent from "./events/checkBuffExpirationEvent";
import CombatStartEvent from "./events/combatStartEvent";
import ConsumableTickEvent from "./events/consumableTickEvent";
import CooldownReadyEvent from "./events/cooldownReadyEvent";
import EnemyRespawnEvent from "./events/enemyRespawnEvent";
import EventQueue from "./events/eventQueue";
import PlayerRespawnEvent from "./events/playerRespawnEvent";
import RegenTickEvent from "./events/regenTickEvent";
import StunExpirationEvent from "./events/stunExpirationEvent";
import SimResult from "./simResult";

const ONE_SECOND = 1e9;
const HOT_TICK_INTERVAL = 5 * ONE_SECOND;
const DOT_TICK_INTERVAL = 5 * ONE_SECOND;
const REGEN_TICK_INTERVAL = 10 * ONE_SECOND;
const ENEMY_RESPAWN_INTERVAL = 3 * ONE_SECOND;
const PLAYER_RESPAWN_INTERVAL = 150 * ONE_SECOND;

class CombatSimulator extends EventTarget {
    constructor(player, zone) {
        super();
        this.players = [player];
        this.zone = zone;

        this.eventQueue = new EventQueue();
        this.simResult = new SimResult();
    }

    async simulate(simulationTimeLimit) {
        this.reset();

        let ticks = 0;

        let combatStartEvent = new CombatStartEvent(0);
        this.eventQueue.addEvent(combatStartEvent);

        while (this.simulationTime < simulationTimeLimit) {
            let nextEvent = this.eventQueue.getNextEvent();
            await this.processEvent(nextEvent);

            ticks++;
            if (ticks == 1000) {
                ticks = 0;
                let progressEvent = new CustomEvent("progress", {
                    detail: Math.min(this.simulationTime / simulationTimeLimit, 1),
                });
                this.dispatchEvent(progressEvent);
            }
        }

        this.simResult.simulatedTime = this.simulationTime;

        return this.simResult;
    }

    reset() {
        this.simulationTime = 0;
        this.eventQueue.clear();
        this.simResult = new SimResult();
    }

    async processEvent(event) {
        this.simulationTime = event.time;

        // console.log(this.simulationTime / 1e9, event.type, event);

        switch (event.type) {
            case CombatStartEvent.type:
                this.processCombatStartEvent(event);
                break;
            case PlayerRespawnEvent.type:
                this.processPlayerRespawnEvent(event);
                break;
            case EnemyRespawnEvent.type:
                this.processEnemyRespawnEvent(event);
                break;
            case AutoAttackEvent.type:
                this.processAutoAttackEvent(event);
                break;
            case ConsumableTickEvent.type:
                this.processConsumableTickEvent(event);
                break;
            case BleedTickEvent.type:
                this.processBleedTickEvent(event);
                break;
            case CheckBuffExpirationEvent.type:
                this.processCheckBuffExpirationEvent(event);
                break;
            case RegenTickEvent.type:
                this.processRegenTickEvent(event);
                break;
            case StunExpirationEvent.type:
                this.processStunExpirationEvent(event);
                break;
            case CooldownReadyEvent.type:
                // Only used to check triggers
                break;
        }

        this.checkTriggers();
    }

    processCombatStartEvent(event) {
        this.players[0].reset(this.simulationTime);

        this.players[0].abilities
            .filter((ability) => ability != null)
            .forEach((ability) => {
                let cooldownReadyEvent = new CooldownReadyEvent(ability.lastUsed + ability.cooldownDuration);
                this.eventQueue.addEvent(cooldownReadyEvent);
            });

        let regenTickEvent = new RegenTickEvent(this.simulationTime + REGEN_TICK_INTERVAL);
        this.eventQueue.addEvent(regenTickEvent);

        this.startNewEncounter();
    }

    processPlayerRespawnEvent(event) {
        this.players[0].combatDetails.currentHitpoints = this.players[0].combatDetails.maxHitpoints;
        this.players[0].combatDetails.currentManapoints = this.players[0].combatDetails.maxManapoints;
        this.players[0].clearBuffs();

        this.startAutoAttacks();
    }

    processEnemyRespawnEvent(event) {
        this.startNewEncounter();
    }

    startNewEncounter() {
        this.enemies = this.zone.getRandomEncounter();

        this.enemies.forEach((enemy) => {
            enemy.reset(this.simulationTime);
            enemy.abilities
                .filter((ability) => ability != null)
                .forEach((ability) => {
                    let cooldownReadyEvent = new CooldownReadyEvent(ability.lastUsed + ability.cooldownDuration);
                    this.eventQueue.addEvent(cooldownReadyEvent);
                });
            // console.log(enemy.hrid, "spawned");
        });

        this.startAutoAttacks();
    }

    startAutoAttacks() {
        let units = [this.players[0]];
        if (this.enemies) {
            units.push(...this.enemies);
        }

        for (const unit of units) {
            if (unit.combatDetails.currentHitpoints <= 0) {
                continue;
            }

            this.addNextAutoAttackEvent(unit);
        }
    }

    processAutoAttackEvent(event) {
        // console.log("source:", event.source.hrid);

        let target;
        if (event.source.isPlayer) {
            target = CombatUtilities.getTarget(this.enemies);
        } else {
            target = CombatUtilities.getTarget(this.players);
        }

        if (!target) {
            return;
        }

        let attackResult = CombatUtilities.processAttack(event.source, target);

        this.simResult.addAttack(
            event.source,
            target,
            "autoAttack",
            attackResult.didHit ? attackResult.damageDone : "miss"
        );

        if (attackResult.lifeStealHeal > 0) {
            this.simResult.addHitpointsGained(event.source, "lifesteal", attackResult.lifeStealHeal);
        }

        if (attackResult.reflectDamageDone > 0) {
            this.simResult.addAttack(target, event.source, "physicalReflect", attackResult.reflectDamageDone);
        }

        for (const [skill, xp] of Object.entries(attackResult.experienceGained.source)) {
            this.simResult.addExperienceGain(event.source, skill, xp);
        }
        for (const [skill, xp] of Object.entries(attackResult.experienceGained.target)) {
            this.simResult.addExperienceGain(target, skill, xp);
        }

        if (target.combatDetails.currentHitpoints == 0) {
            this.eventQueue.clearEventsForUnit(target);
            this.simResult.addDeath(target);
            // console.log(target.hrid, "died");
        }

        // Could die from reflect damage
        if (event.source.combatDetails.currentHitpoints == 0) {
            this.eventQueue.clearEventsForUnit(event.source);
            this.simResult.addDeath(event.source);
        }

        if (!this.checkEncounterEnd()) {
            this.addNextAutoAttackEvent(event.source);
        }
    }

    checkEncounterEnd() {
        let encounterEnded = false;

        if (this.enemies && !this.enemies.some((enemy) => enemy.combatDetails.currentHitpoints > 0)) {
            this.eventQueue.clearEventsOfType(AutoAttackEvent.type);
            let enemyRespawnEvent = new EnemyRespawnEvent(this.simulationTime + ENEMY_RESPAWN_INTERVAL);
            this.eventQueue.addEvent(enemyRespawnEvent);
            this.enemies = null;

            this.simResult.addEncounterEnd();
            // console.log("All enemies died");

            encounterEnded = true;
        }

        if (
            !this.players.some((player) => player.combatDetails.currentHitpoints > 0) &&
            !this.eventQueue.containsEventOfType(PlayerRespawnEvent.type)
        ) {
            this.eventQueue.clearEventsOfType(AutoAttackEvent.type);
            // 120 seconds respawn and 30 seconds traveling to battle
            let playerRespawnEvent = new PlayerRespawnEvent(this.simulationTime + PLAYER_RESPAWN_INTERVAL);
            this.eventQueue.addEvent(playerRespawnEvent);
            // console.log("Player died");

            encounterEnded = true;
        }

        return encounterEnded;
    }

    addNextAutoAttackEvent(source) {
        let autoAttackEvent = new AutoAttackEvent(
            this.simulationTime + source.combatDetails.combatStats.attackInterval,
            source
        );
        this.eventQueue.addEvent(autoAttackEvent);
    }

    processConsumableTickEvent(event) {
        if (event.consumable.hitpointRestore > 0) {
            let tickValue = CombatUtilities.calculateTickValue(
                event.consumable.hitpointRestore,
                event.totalTicks,
                event.currentTick
            );
            let hitpointsAdded = event.source.addHitpoints(tickValue);
            this.simResult.addHitpointsGained(event.source, event.consumable.hrid, hitpointsAdded);
            // console.log("Added hitpoints:", hitpointsAdded);
        }

        if (event.consumable.manapointRestore > 0) {
            let tickValue = CombatUtilities.calculateTickValue(
                event.consumable.manapointRestore,
                event.totalTicks,
                event.currentTick
            );
            let manapointsAdded = event.source.addManapoints(tickValue);
            this.simResult.addManapointsGained(event.source, event.consumable.hrid, manapointsAdded);
            // console.log("Added manapoints:", manapointsAdded);
        }

        if (event.currentTick < event.totalTicks) {
            let consumableTickEvent = new ConsumableTickEvent(
                this.simulationTime + HOT_TICK_INTERVAL,
                event.source,
                event.consumable,
                event.totalTicks,
                event.currentTick + 1
            );
            this.eventQueue.addEvent(consumableTickEvent);
        }
    }

    processBleedTickEvent(event) {
        let tickDamage = CombatUtilities.calculateTickValue(event.damage, event.totalTicks, event.currentTick);
        let damage = Math.min(tickDamage, event.target.combatDetails.currentHitpoints);

        event.target.combatDetails.currentHitpoints -= damage;
        this.simResult.addAttack(event.sourceRef, event.target, "bleed", damage);

        let targetStaminaExperience = CombatUtilities.calculateStaminaExperience(0, damage);
        this.simResult.addExperienceGain(event.target, "stamina", targetStaminaExperience);
        // console.log(event.target.hrid, "bleed for", damage);

        if (event.currentTick < event.totalTicks) {
            let bleedTickEvent = new BleedTickEvent(
                this.simulationTime + DOT_TICK_INTERVAL,
                event.sourceRef,
                event.target,
                event.damage,
                event.totalTicks,
                event.currentTick + 1
            );
            this.eventQueue.addEvent(bleedTickEvent);
        }

        if (event.target.combatDetails.currentHitpoints == 0) {
            this.eventQueue.clearEventsForUnit(event.target);
            this.simResult.addDeath(event.target);
        }

        this.checkEncounterEnd();
    }

    processRegenTickEvent(event) {
        let units = [...this.players];
        if (this.enemies) {
            units.push(...this.enemies);
        }

        for (const unit of units) {
            if (unit.combatDetails.currentHitpoints <= 0) {
                continue;
            }

            let hitpointRegen = Math.floor(unit.combatDetails.maxHitpoints * unit.combatDetails.combatStats.HPRegen);
            let hitpointsAdded = unit.addHitpoints(hitpointRegen);
            this.simResult.addHitpointsGained(unit, "regen", hitpointsAdded);
            // console.log("Added hitpoints:", hitpointsAdded);

            let manapointRegen = Math.floor(unit.combatDetails.maxManapoints * unit.combatDetails.combatStats.MPRegen);
            let manapointsAdded = unit.addManapoints(manapointRegen);
            this.simResult.addManapointsGained(unit, "regen", manapointsAdded);
            // console.log("Added manapoints:", manapointsAdded);
        }

        let regenTickEvent = new RegenTickEvent(this.simulationTime + REGEN_TICK_INTERVAL);
        this.eventQueue.addEvent(regenTickEvent);
    }

    processCheckBuffExpirationEvent(event) {
        event.source.removeExpiredBuffs(this.simulationTime);
    }

    processStunExpirationEvent(event) {
        event.source.isStunned = false;
        this.addNextAutoAttackEvent(event.source);
    }

    checkTriggers() {
        let triggeredSomething;

        do {
            triggeredSomething = false;

            this.players
                .filter((player) => player.combatDetails.currentHitpoints > 0)
                .forEach((player) => {
                    if (this.checkTriggersForUnit(player, this.players, this.enemies)) {
                        triggeredSomething = true;
                    }
                });

            if (this.enemies) {
                this.enemies
                    .filter((enemy) => enemy.combatDetails.currentHitpoints > 0)
                    .forEach((enemy) => {
                        if (this.checkTriggersForUnit(enemy, this.enemies, this.players)) {
                            triggeredSomething = true;
                        }
                    });
            }
        } while (triggeredSomething);
    }

    checkTriggersForUnit(unit, friendlies, enemies) {
        if (unit.combatDetails.currentHitpoints <= 0) {
            throw new Error("Checking triggers for a dead unit");
        }

        let triggeredSomething = false;
        let target = CombatUtilities.getTarget(enemies);

        for (const food of unit.food) {
            if (food && food.shouldTrigger(this.simulationTime, unit, target, friendlies, enemies)) {
                let result = this.tryUseConsumable(unit, food);
                if (result) {
                    triggeredSomething = true;
                }
            }
        }

        for (const drink of unit.drinks) {
            if (drink && drink.shouldTrigger(this.simulationTime, unit, target, friendlies, enemies)) {
                let result = this.tryUseConsumable(unit, drink);
                if (result) {
                    triggeredSomething = true;
                }
            }
        }

        for (const ability of unit.abilities) {
            if (ability && ability.shouldTrigger(this.simulationTime, unit, target, friendlies, enemies)) {
                let result = this.tryUseAbility(unit, ability);
                if (result) {
                    triggeredSomething = true;
                }
            }
        }

        return triggeredSomething;
    }

    tryUseConsumable(source, consumable) {
        // console.log("Consuming:", consumable);

        if (source.combatDetails.currentHitpoints <= 0) {
            return false;
        }

        consumable.lastUsed = this.simulationTime;
        let cooldownReadyEvent = new CooldownReadyEvent(this.simulationTime + consumable.cooldownDuration);
        this.eventQueue.addEvent(cooldownReadyEvent);

        this.simResult.addConsumableUse(source, consumable);

        if (consumable.recoveryDuration == 0) {
            if (consumable.hitpointRestore > 0) {
                let hitpointsAdded = source.addHitpoints(consumable.hitpointRestore);
                this.simResult.addHitpointsGained(source, consumable.hrid, hitpointsAdded);
                // console.log("Added hitpoints:", hitpointsAdded);
            }

            if (consumable.manapointRestore > 0) {
                let manapointsAdded = source.addManapoints(consumable.manapointRestore);
                this.simResult.addManapointsGained(source, consumable.hrid, manapointsAdded);
                // console.log("Added manapoints:", manapointsAdded);
            }
        } else {
            let consumableTickEvent = new ConsumableTickEvent(
                this.simulationTime + HOT_TICK_INTERVAL,
                source,
                consumable,
                consumable.recoveryDuration / HOT_TICK_INTERVAL,
                1
            );
            this.eventQueue.addEvent(consumableTickEvent);
        }

        for (const buff of consumable.buffs) {
            source.addBuff(buff, this.simulationTime);
            // console.log("Added buff:", buff);
            let checkBuffExpirationEvent = new CheckBuffExpirationEvent(this.simulationTime + buff.duration, source);
            this.eventQueue.addEvent(checkBuffExpirationEvent);
        }

        return true;
    }

    tryUseAbility(source, ability) {
        if (source.combatDetails.currentHitpoints <= 0) {
            return false;
        }

        if (source.combatDetails.currentManapoints < ability.manaCost) {
            if (source.isPlayer) {
                this.simResult.playerRanOutOfMana = true;
            }
            return false;
        }

        // console.log("Casting:", ability);

        source.combatDetails.currentManapoints -= ability.manaCost;

        let sourceIntelligenceExperience = CombatUtilities.calculateIntelligenceExperience(ability.manaCost);
        this.simResult.addExperienceGain(source, "intelligence", sourceIntelligenceExperience);

        ability.lastUsed = this.simulationTime;
        let cooldownReadyEvent = new CooldownReadyEvent(this.simulationTime + ability.cooldownDuration);
        this.eventQueue.addEvent(cooldownReadyEvent);

        for (const abilityEffect of ability.abilityEffects) {
            switch (abilityEffect.effectType) {
                case "/ability_effect_types/buff":
                    this.processAbilityBuffEffect(source, ability, abilityEffect);
                    break;
                case "/ability_effect_types/damage":
                    this.processAbilityDamageEffect(source, ability, abilityEffect);
                    break;
                case "/ability_effect_types/heal":
                    this.processAbilityHealEffect(source, ability, abilityEffect);
                    break;
                default:
                    throw new Error("Unsupported effect type for ability: " + ability.hrid);
            }
        }

        // Could die from reflect damage
        if (source.combatDetails.currentHitpoints == 0) {
            this.eventQueue.clearEventsForUnit(source);
            this.simResult.addDeath(source);
        }

        this.checkEncounterEnd();

        return true;
    }

    processAbilityBuffEffect(source, ability, abilityEffect) {
        if (abilityEffect.targetType != "self") {
            throw new Error("Unsupported target type for buff ability effect: " + ability.hrid);
        }

        for (const buff of abilityEffect.buffs) {
            source.addBuff(buff, this.simulationTime);
            // console.log("Added buff:", abilityEffect.buff);
            let checkBuffExpirationEvent = new CheckBuffExpirationEvent(this.simulationTime + buff.duration, source);
            this.eventQueue.addEvent(checkBuffExpirationEvent);
        }
    }

    processAbilityDamageEffect(source, ability, abilityEffect) {
        let targets;
        switch (abilityEffect.targetType) {
            case "enemy":
                targets = source.isPlayer
                    ? [CombatUtilities.getTarget(this.enemies)]
                    : [CombatUtilities.getTarget(this.players)];
                break;
            case "all enemies":
                targets = source.isPlayer ? this.enemies : this.players;
                break;
            default:
                throw new Error("Unsupported target type for damage ability effect: " + ability.hrid);
        }

        for (const target of targets.filter((unit) => unit && unit.combatDetails.currentHitpoints > 0)) {
            let attackResult = CombatUtilities.processAttack(source, target, abilityEffect);

            if (attackResult.didHit && abilityEffect.buffs) {
                for (const buff of abilityEffect.buffs) {
                    target.addBuff(buff, this.simulationTime);
                    let checkBuffExpirationEvent = new CheckBuffExpirationEvent(
                        this.simulationTime + buff.duration,
                        target
                    );
                    this.eventQueue.addEvent(checkBuffExpirationEvent);
                }
            }

            if (abilityEffect.bleedRatio > 0 && attackResult.damageDone > 0) {
                let bleedTickEvent = new BleedTickEvent(
                    this.simulationTime + DOT_TICK_INTERVAL,
                    source,
                    target,
                    attackResult.damageDone * abilityEffect.bleedRatio,
                    abilityEffect.bleedDuration / DOT_TICK_INTERVAL,
                    1
                );
                this.eventQueue.addEvent(bleedTickEvent);
            }

            if (attackResult.didHit && abilityEffect.stunChance > 0 && Math.random() < abilityEffect.stunChance) {
                target.isStunned = true;
                target.stunExpireTime = this.simulationTime + abilityEffect.stunDuration;
                this.eventQueue.clearMatching((event) => event.type == AutoAttackEvent.type && event.source == target);
                let stunExpirationEvent = new StunExpirationEvent(target.stunExpireTime, target);
                this.eventQueue.addEvent(stunExpirationEvent);
            }

            this.simResult.addAttack(
                source,
                target,
                ability.hrid,
                attackResult.didHit ? attackResult.damageDone : "miss"
            );

            if (attackResult.reflectDamageDone > 0) {
                this.simResult.addAttack(target, source, "physicalReflect", attackResult.reflectDamageDone);
            }

            for (const [skill, xp] of Object.entries(attackResult.experienceGained.source)) {
                this.simResult.addExperienceGain(source, skill, xp);
            }
            for (const [skill, xp] of Object.entries(attackResult.experienceGained.target)) {
                this.simResult.addExperienceGain(target, skill, xp);
            }

            if (target.combatDetails.currentHitpoints == 0) {
                this.eventQueue.clearEventsForUnit(target);
                this.simResult.addDeath(target);
                // console.log(target.hrid, "died");
            }
        }
    }

    processAbilityHealEffect(source, ability, abilityEffect) {
        if (abilityEffect.targetType != "self") {
            throw new Error("Unsupported target type for heal ability effect: " + ability.hrid);
        }

        let amountHealed = CombatUtilities.processHeal(source, abilityEffect);
        let experienceGained = CombatUtilities.calculateMagicExperience(amountHealed);

        this.simResult.addHitpointsGained(source, ability.hrid, amountHealed);
        this.simResult.addExperienceGain(source, "magic", experienceGained);
    }
}

export default CombatSimulator;
