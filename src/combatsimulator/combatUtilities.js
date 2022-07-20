class CombatUtilities {
    static getTarget(enemies) {
        if (!enemies) {
            return null;
        }
        let target = enemies.find((enemy) => enemy.combatStats.currentHitpoints > 0);

        return target ?? null;
    }

    static randomInt(min, max) {
        return Math.floor(min + Math.random() * (max - min + 1));
    }

    static calculateHitChance(source, target, combatStyle) {
        let sourceAccuracy = source.combatStats[combatStyle + "AccuracyRating"];
        let targetEvasion = target.combatStats[combatStyle + "EvasionRating"];

        let hitChance = Math.pow(sourceAccuracy, 1.4) / (Math.pow(sourceAccuracy, 1.4) + Math.pow(targetEvasion, 1.4));

        return hitChance;
    }

    static processAttack(source, target, abilityEffect) {
        let combatStyle = abilityEffect ? abilityEffect.combatStyleHrid : source.combatStats.combatStyleHrid;
        let minDamage = 1;
        let maxDamage = source.combatStats[combatStyle + "MaxDamage"];

        if (abilityEffect) {
            minDamage += abilityEffect.damageFlat;
            maxDamage *= abilityEffect.damageRatio;
            maxDamage += abilityEffect.damageFlat;
        }

        let damageRoll = CombatUtilities.randomInt(minDamage, maxDamage);
        let premitigatedDamage = Math.min(damageRoll, target.combatStats.currentHitpoints);

        let damageDone = 0;
        let hitChance = CombatUtilities.calculateHitChance(source, target, combatStyle);

        if (Math.random() < hitChance) {
            let damageTakenRatio = 100 / (100 + target.combatStats.armor);
            let mitigatedDamage = damageTakenRatio * premitigatedDamage;
            damageDone = CombatUtilities.randomInt(mitigatedDamage, mitigatedDamage);
            target.combatStats.currentHitpoints -= damageDone;
        }

        let damagePrevented = premitigatedDamage - damageDone;

        return { damageDone, damagePrevented, maxDamage };
    }

    static calculateTickValue(totalValue, totalTicks, currentTick) {
        let currentSum = Math.floor((currentTick * totalValue) / totalTicks);
        let previousSum = Math.floor(((currentTick - 1) * totalValue) / totalTicks);

        return currentSum - previousSum;
    }

    static calculateStaminaExperience(damagePrevented, damageTaken) {
        return 0.05 * damagePrevented + 0.5 * damageTaken;
    }

    static calculateIntelligenceExperience(manaUsed) {
        return 0.5 * manaUsed;
    }

    static calculateAttackExperience(damageDone) {
        return 0.45 + 0.125 * damageDone;
    }

    static calculatePowerExperience(maxDamage) {
        return 0.3 + 0.04 * maxDamage;
    }

    static calculateDefenseExperience(damagePrevented) {
        return 0.4 + 0.15 * damagePrevented;
    }
}

export default CombatUtilities;
