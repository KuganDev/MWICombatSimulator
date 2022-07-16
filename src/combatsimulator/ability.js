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
                combatStyleHrid: effect.combatStyleHrid,
                damageFlat: effect.baseDamageFlat + (this.level - 1) * effect.baseDamageFlatLevelBonus,
                damageRation: effect.baseDamageRatio + (this.level - 1) * effect.baseDamageRatioLevelBonus,
                bleedRatio: effect.bleedRatio,
                duration: effect.duration,
                buff: new Buff(effect.buff, this.level),
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
    }
}

export default Ability;
