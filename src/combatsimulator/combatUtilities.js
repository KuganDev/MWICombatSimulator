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

    static processAttack(source, target, abilityEffect = null) {
        let combatStyle = abilityEffect
            ? abilityEffect.combatStyleHrid
            : source.combatDetails.combatStats.combatStyleHrid;
        let damageType = abilityEffect ? abilityEffect.damageType : source.combatDetails.combatStats.damageType;

        let sourceAccuracyRating = 1;
        let sourceAutoAttackMaxDamage = 1;
        let targetEvasionRating = 1;

        switch (combatStyle) {
            case "/combat_styles/stab":
                sourceAccuracyRating = source.combatDetails.stabAccuracyRating;
                sourceAutoAttackMaxDamage = source.combatDetails.stabMaxDamage;
                targetEvasionRating = target.combatDetails.stabEvasionRating;
                break;
            case "/combat_styles/slash":
                sourceAccuracyRating = source.combatDetails.slashAccuracyRating;
                sourceAutoAttackMaxDamage = source.combatDetails.slashMaxDamage;
                targetEvasionRating = target.combatDetails.slashEvasionRating;
                break;
            case "/combat_styles/smash":
                sourceAccuracyRating = source.combatDetails.smashAccuracyRating;
                sourceAutoAttackMaxDamage = source.combatDetails.smashMaxDamage;
                targetEvasionRating = target.combatDetails.smashEvasionRating;
                break;
            case "/combat_styles/ranged":
                sourceAccuracyRating = source.combatDetails.rangedAccuracyRating;
                sourceAutoAttackMaxDamage = source.combatDetails.rangedMaxDamage;
                targetEvasionRating = target.combatDetails.rangedEvasionRating;
                break;
            case "/combat_styles/magic":
                sourceAutoAttackMaxDamage = source.combatDetails.magicMaxDamage;
                break;
            default:
                throw new Error("Unknown combat style: " + combatStyle);
        }

        let sourceDamageMultiplier = 1;
        let sourceResistance = 0;
        let targetResistance = 0;
        let targetReflectPower = 0;

        switch (damageType) {
            case "/damage_types/physical":
                sourceDamageMultiplier = 1 + source.combatDetails.combatStats.physicalAmplify;
                sourceResistance = source.combatDetails.totalArmor;
                targetResistance = target.combatDetails.totalArmor;
                targetReflectPower = target.combatDetails.combatStats.physicalReflectPower;
                break;
            case "/damage_types/water":
                sourceDamageMultiplier = 1 + source.combatDetails.combatStats.waterAmplify;
                sourceResistance = source.combatDetails.totalWaterResistance;
                targetResistance = target.combatDetails.totalWaterResistance;
                break;
            case "/damage_types/nature":
                sourceDamageMultiplier = 1 + source.combatDetails.combatStats.natureAmplify;
                sourceResistance = source.combatDetails.totalNatureResistance;
                targetResistance = target.combatDetails.totalNatureResistance;
                break;
            case "/damage_types/fire":
                sourceDamageMultiplier = 1 + source.combatDetails.combatStats.fireAmplify;
                sourceResistance = source.combatDetails.totalFireResistance;
                targetResistance = target.combatDetails.totalFireResistance;
                break;
            default:
                throw new Error("Unknown damage type: " + damageType);
        }

        let hitChance = 1;
        let critChance = 0;

        if (combatStyle != "/combat_styles/magic") {
            hitChance =
                Math.pow(sourceAccuracyRating, 1.4) /
                (Math.pow(sourceAccuracyRating, 1.4) + Math.pow(targetEvasionRating, 1.4));
        }

        if (combatStyle == "/combat_styles/ranged") {
            critChance = 0.3 * hitChance;
        }

        let baseDamageFlat = abilityEffect ? abilityEffect.damageFlat : 0;
        let baseDamageRatio = abilityEffect ? abilityEffect.damageRatio : 1;

        let sourceMinDamage = sourceDamageMultiplier * (1 + baseDamageFlat);
        let sourceMaxDamage = sourceDamageMultiplier * (baseDamageRatio * sourceAutoAttackMaxDamage + baseDamageFlat);

        if (Math.random() < critChance) {
            sourceMinDamage = sourceMaxDamage;
        }

        let damageRoll = CombatUtilities.randomInt(sourceMinDamage, sourceMaxDamage);
        let maxPremitigatedDamage = Math.min(damageRoll, target.combatDetails.currentHitpoints);

        let damageDone = 0;
        let mitigatedReflectDamage = 0;
        let reflectDamageDone = 0;

        let didHit = false;
        if (Math.random() < hitChance) {
            didHit = true;

            let targetDamageTakenRatio = 100 / (100 + targetResistance);
            if (targetResistance < 0) {
                targetDamageTakenRatio = (100 - targetResistance) / 100;
            }

            let mitigatedDamage = Math.ceil(targetDamageTakenRatio * damageRoll);
            damageDone = Math.min(mitigatedDamage, target.combatDetails.currentHitpoints);
            target.combatDetails.currentHitpoints -= damageDone;
        }

        if (targetReflectPower > 0 && targetResistance > 0) {
            let sourceDamageTakenRatio = 100 / (100 + sourceResistance);
            if (sourceResistance < 0) {
                sourceDamageTakenRatio = (100 - sourceResistance) / 100;
            }

            let reflectDamage = Math.ceil(targetReflectPower * targetResistance);
            mitigatedReflectDamage = Math.ceil(sourceDamageTakenRatio * reflectDamage);
            reflectDamageDone = Math.min(mitigatedReflectDamage, source.combatDetails.currentHitpoints);
            source.combatDetails.currentHitpoints -= reflectDamageDone;
        }

        let lifeStealHeal = 0;
        if (!abilityEffect && didHit && source.combatDetails.combatStats.lifeSteal > 0) {
            lifeStealHeal = source.addHitpoints(Math.floor(source.combatDetails.combatStats.lifeSteal * damageDone));
        }

        let experienceGained = {
            source: {
                attack: 0,
                power: 0,
                ranged: 0,
                magic: 0,
            },
            target: {
                defense: 0,
                stamina: 0,
            },
        };

        switch (combatStyle) {
            case "/combat_styles/stab":
                experienceGained.source.attack = this.calculateAttackExperience(damageDone, combatStyle);
                break;
            case "/combat_styles/slash":
                experienceGained.source.attack = this.calculateAttackExperience(damageDone, combatStyle);
                experienceGained.source.power = this.calculatePowerExperience(damageDone, combatStyle);
                break;
            case "/combat_styles/smash":
                experienceGained.source.power = this.calculatePowerExperience(damageDone, combatStyle);
                break;
            case "/combat_styles/ranged":
                experienceGained.source.ranged = this.calculateRangedExperience(damageDone);
                break;
            case "/combat_styles/magic":
                experienceGained.source.magic = this.calculateMagicExperience(damageDone);
                break;
        }

        let damagePrevented = maxPremitigatedDamage - damageDone;

        experienceGained.target.defense = this.calculateDefenseExperience(damagePrevented);
        experienceGained.target.stamina = this.calculateStaminaExperience(damagePrevented, damageDone);

        if (mitigatedReflectDamage > 0) {
            experienceGained.target.defense += this.calculateDefenseExperience(mitigatedReflectDamage);
        }

        return { damageDone, didHit, reflectDamageDone, lifeStealHeal, experienceGained };
    }

    static processHeal(source, abilityEffect) {
        if (abilityEffect.combatStyleHrid != "/combat_styles/magic") {
            throw new Error("Heal ability effect not supported for combat style: " + abilityEffect.combatStyleHrid);
        }

        let healingAmplify = 1 + source.combatDetails.combatStats.healingAmplify;
        let magicMaxDamage = source.combatDetails.magicMaxDamage;

        let baseHealFlat = abilityEffect.damageFlat;
        let baseHealRatio = abilityEffect.damageRatio;

        let minHeal = healingAmplify * (1 + baseHealFlat);
        let maxHeal = healingAmplify * (baseHealRatio * magicMaxDamage + baseHealFlat);

        let heal = this.randomInt(minHeal, maxHeal);
        let amountHealed = source.addHitpoints(heal);

        return amountHealed;
    }

    static calculateTickValue(totalValue, totalTicks, currentTick) {
        let currentSum = Math.floor((currentTick * totalValue) / totalTicks);
        let previousSum = Math.floor(((currentTick - 1) * totalValue) / totalTicks);

        return currentSum - previousSum;
    }

    static calculateStaminaExperience(damagePrevented, damageTaken) {
        return 0.03 * damagePrevented + 0.3 * damageTaken;
    }

    static calculateIntelligenceExperience(manaUsed) {
        return 0.3 * manaUsed;
    }

    static calculateAttackExperience(damage, combatStyle) {
        switch (combatStyle) {
            case "/combat_styles/stab":
                return 0.6 + 0.15 * damage;
            case "/combat_styles/slash":
                return 0.3 + 0.075 * damage;
            default:
                return 0;
        }
    }

    static calculatePowerExperience(damage, combatStyle) {
        switch (combatStyle) {
            case "/combat_styles/smash":
                return 0.6 + 0.15 * damage;
            case "/combat_styles/slash":
                return 0.3 + 0.075 * damage;
            default:
                return 0;
        }
    }

    static calculateDefenseExperience(damagePrevented) {
        return 0.4 + 0.1 * damagePrevented;
    }

    static calculateRangedExperience(damage) {
        return 0.4 + 0.1 * damage;
    }

    static calculateMagicExperience(damage) {
        return 0.4 + 0.1 * damage;
    }
}

export default CombatUtilities;
