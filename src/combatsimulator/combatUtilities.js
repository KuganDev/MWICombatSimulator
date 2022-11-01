class CombatUtilities {
    static getTarget(enemies) {
        if (!enemies) {
            return null;
        }
        let target = enemies.find((enemy) => enemy.combatDetails.currentHitpoints > 0);

        return target ?? null;
    }

    static randomInt(min, max) {
        if (max < min) {
            let temp = min;
            min = max;
            max = temp;
        }

        let minCeil = Math.ceil(min);
        let maxFloor = Math.floor(max);

        if (Math.floor(min) == maxFloor) {
            return Math.floor((min + max) / 2 + Math.random());
        }

        let minTail = -1 * (min - minCeil);
        let maxTail = max - maxFloor;

        let balancedWeight = 2 * minTail + (maxFloor - minCeil);
        let balancedAverage = (maxFloor + minCeil) / 2;
        let average = (max + min) / 2;
        let extraTailWeight = (balancedWeight * (average - balancedAverage)) / (maxFloor + 1 - average);
        let extraTailChance = Math.abs(extraTailWeight / (extraTailWeight + balancedWeight));

        if (Math.random() < extraTailChance) {
            if (maxTail > minTail) {
                return Math.floor(maxFloor + 1);
            } else {
                return Math.floor(minCeil - 1);
            }
        }

        if (maxTail > minTail) {
            return Math.floor(min + Math.random() * (maxFloor + minTail - min + 1));
        } else {
            return Math.floor(minCeil - maxTail + Math.random() * (max - (minCeil - maxTail) + 1));
        }
    }

    static calculateHitChance(source, target, combatStyle) {
        let sourceAccuracy = source.combatDetails[combatStyle + "AccuracyRating"];
        let targetEvasion = target.combatDetails[combatStyle + "EvasionRating"];

        let hitChance = Math.pow(sourceAccuracy, 1.4) / (Math.pow(sourceAccuracy, 1.4) + Math.pow(targetEvasion, 1.4));

        return hitChance;
    }

    static processAttack(source, target, abilityEffect) {
        let combatStyle = abilityEffect ? abilityEffect.combatStyleHrid : source.combatDetails.combatStyleHrid;
        let minDamage = 1;
        let maxDamage = source.combatDetails[combatStyle + "MaxDamage"];

        if (abilityEffect) {
            minDamage += abilityEffect.damageFlat;
            maxDamage *= abilityEffect.damageRatio;
            maxDamage += abilityEffect.damageFlat;
        }

        let damageRoll = CombatUtilities.randomInt(minDamage, maxDamage);
        let maxPremitigatedDamage = Math.min(damageRoll, target.combatDetails.currentHitpoints);

        let damageDone = 0;
        let physicalReflectDamageDone = 0;
        let hitChance = CombatUtilities.calculateHitChance(source, target, combatStyle);

        let didHit = false;
        if (Math.random() < hitChance) {
            didHit = true;
            let targetDamageTakenRatio = 100 / (100 + target.combatDetails.armor);
            let mitigatedDamage = Math.ceil(targetDamageTakenRatio * damageRoll);
            damageDone = Math.min(mitigatedDamage, target.combatDetails.currentHitpoints);
            target.combatDetails.currentHitpoints -= damageDone;

            if (target.combatDetails.physicalReflectPower > 0) {
                let physicalReflectDamage = Math.ceil(
                    target.combatDetails.armor * target.combatDetails.physicalReflectPower
                );
                let sourceDamageTakenRatio = 100 / (100 + source.combatDetails.armor);
                let mitigatedPhysicalReflectDamage = Math.ceil(sourceDamageTakenRatio * physicalReflectDamage);
                physicalReflectDamageDone = Math.min(
                    mitigatedPhysicalReflectDamage,
                    source.combatDetails.currentHitpoints
                );
                source.combatDetails.currentHitpoints -= physicalReflectDamageDone;
            }
        }

        let damagePrevented = maxPremitigatedDamage - damageDone;

        return { damageDone, damagePrevented, maxDamage, didHit, physicalReflectDamageDone };
    }

    static calculateTickValue(totalValue, totalTicks, currentTick) {
        let currentSum = Math.floor((currentTick * totalValue) / totalTicks);
        let previousSum = Math.floor(((currentTick - 1) * totalValue) / totalTicks);

        return currentSum - previousSum;
    }

    static calculateStaminaExperience(damagePrevented, damageTaken) {
        return 0.04 * damagePrevented + 0.4 * damageTaken;
    }

    static calculateIntelligenceExperience(manaUsed) {
        return 0.4 * manaUsed;
    }

    static calculateAttackExperience(damageDone) {
        return 0.4 + 0.1 * damageDone;
    }

    static calculatePowerExperience(maxDamage) {
        return 0.2 + 0.03 * maxDamage;
    }

    static calculateDefenseExperience(damagePrevented) {
        return 0.4 + 0.12 * damagePrevented;
    }
}

export default CombatUtilities;
