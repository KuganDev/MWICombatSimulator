import Buff from "./buff";
import abilityDetailMap from "./data/abilityDetailMap.json";
import Trigger from "./trigger";

class Ability {
    constructor(hrid, level, triggers = null) {
        this.hrid = hrid;
        this.level = level;

        let gameAbility = abilityDetailMap[hrid];
        console.assert(gameAbility, "No ability found for hrid:" + this.hrid);

        this.manaCost = gameAbility.manaCost;
        this.cooldownDuration = gameAbility.cooldownDuration;

        this.abilityEffects = [];

        for (const effect of gameAbility.abilityEffects) {
            let abilityEffect = {
                targetType: effect.targetType,
                effectType: effect.effectType,
                combatStyleHrid: effect.combatStyleHrid.slice(effect.combatStyleHrid.lastIndexOf("/") + 1),
                damageFlat: effect.baseDamageFlat + (this.level - 1) * effect.baseDamageFlatLevelBonus,
                damageRatio: effect.baseDamageRatio + (this.level - 1) * effect.baseDamageRatioLevelBonus,
                bleedRatio: effect.bleedRatio,
                duration: effect.duration,
                buff: effect.buff.duration > 0 ? new Buff(effect.buff, this.level) : null,
            };
            this.abilityEffects.push(abilityEffect);
        }

        if (triggers) {
            this.triggers = triggers;
        } else {
            this.triggers = [];
            for (const defaultTrigger of gameAbility.defaultCombatTriggers) {
                let trigger = new Trigger(
                    defaultTrigger.dependencyHrid,
                    defaultTrigger.conditionHrid,
                    defaultTrigger.comparatorHrid,
                    defaultTrigger.value
                );
                this.triggers.push(trigger);
            }
        }

        this.lastUsed = Number.MIN_SAFE_INTEGER;
    }

    shouldTrigger(currentTime, source, target, friendlies, enemies) {
        if (this.lastUsed + this.cooldownDuration > currentTime) {
            return false;
        }

        if (source.combatStats.currentManapoints < this.manaCost) {
            return false;
        }

        if (this.triggers.length == 0) {
            return true;
        }

        let shouldTrigger = true;
        for (const trigger of this.triggers) {
            if (!trigger.isActive(source, target, friendlies, enemies)) {
                shouldTrigger = false;
            }
        }

        return shouldTrigger;
    }
}

export default Ability;
