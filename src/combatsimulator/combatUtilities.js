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

        let damage = 0;
        let hitChance = CombatUtilities.calculateHitChance(source, target, combatStyle);

        if (Math.random() < hitChance) {
            let damageTakenRatio = 100 / (100 + target.combatStats.armor);
            let mitigatedDamage = damageTakenRatio * premitigatedDamage;
            damage = CombatUtilities.randomInt(mitigatedDamage, mitigatedDamage);
            target.combatStats.currentHitpoints -= damage;
        }

        let damagePrevented = premitigatedDamage - damage;

        return { damage, damagePrevented };
    }

    static calculateTickValue(totalValue, totalTicks, currentTick) {
        let currentSum = Math.floor((currentTick * totalValue) / totalTicks);
        let previousSum = Math.floor(((currentTick - 1) * totalValue) / totalTicks);

        return currentSum - previousSum;
    }
}

export default CombatUtilities;
