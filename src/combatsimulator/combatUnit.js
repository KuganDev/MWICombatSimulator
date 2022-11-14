class CombatUnit {
    isPlayer;
    isStunned = false;
    stunExpireTime = null;

    // Base levels which don't change after initialization
    staminaLevel = 1;
    intelligenceLevel = 1;
    attackLevel = 1;
    powerLevel = 1;
    defenseLevel = 1;
    rangedLevel = 1;
    magicLevel = 1;

    abilities = [null, null, null, null];
    food = [null, null, null];
    drinks = [null, null, null];

    // Calculated combat stats including temporary buffs
    combatDetails = {
        staminaLevel: 1,
        intelligenceLevel: 1,
        attackLevel: 1,
        powerLevel: 1,
        defenseLevel: 1,
        rangedLevel: 1,
        magicLevel: 1,
        maxHitpoints: 110,
        currentHitpoints: 110,
        maxManapoints: 110,
        currentManapoints: 110,
        stabAccuracyRating: 11,
        slashAccuracyRating: 11,
        smashAccuracyRating: 11,
        rangedAccuracyRating: 11,
        stabMaxDamage: 11,
        slashMaxDamage: 11,
        smashMaxDamage: 11,
        rangedMaxDamage: 11,
        magicMaxDamage: 11,
        stabEvasionRating: 11,
        slashEvasionRating: 11,
        smashEvasionRating: 11,
        rangedEvasionRating: 11,
        totalArmor: 0.2,
        totalWaterResistance: 0.4,
        totalNatureResistance: 0.4,
        totalFireResistance: 0.4,
        combatStats: {
            combatStyleHrid: "/combat_styles/smash",
            damageType: "/damage_types/physical",
            attackInterval: 3000000000,
            stabAccuracy: 0,
            slashAccuracy: 0,
            smashAccuracy: 0,
            rangedAccuracy: 0,
            stabDamage: 0,
            slashDamage: 0,
            smashDamage: 0,
            rangedDamage: 0,
            magicDamage: 0,
            physicalAmplify: 0,
            waterAmplify: 0,
            natureAmplify: 0,
            fireAmplify: 0,
            healingAmplify: 0,
            stabEvasion: 0,
            slashEvasion: 0,
            smashEvasion: 0,
            rangedEvasion: 0,
            armor: 0,
            waterResistance: 0,
            natureResistance: 0,
            fireResistance: 0,
            maxHitpoints: 0,
            maxManapoints: 0,
            lifeSteal: 0,
            HPRegen: 0.01,
            MPRegen: 0.01,
            physicalReflectPower: 0,
            dropRate: 0,
            dropQuantity: 0,
            experienceRate: 0,
            foodSlots: 1,
            drinkSlots: 1,
        },
    };
    combatBuffs = {};

    constructor() {}

    updateCombatDetails() {
        this.combatDetails.combatStats.HPRegen = 0.01;
        this.combatDetails.combatStats.MPRegen = 0.01;

        ["stamina", "intelligence", "attack", "power", "defense", "ranged", "magic"].forEach((stat) => {
            this.combatDetails[stat + "Level"] = this[stat + "Level"];
            let boosts = this.getBuffBoosts("/buff_types/" + stat + "_level");
            boosts.forEach((buff) => {
                this.combatDetails[stat + "Level"] += Math.floor(this[stat + "Level"] * buff.ratioBoost);
                this.combatDetails[stat + "Level"] += buff.flatBoost;
            });
        });

        this.combatDetails.maxHitpoints =
            10 * (10 + this.combatDetails.staminaLevel) + this.combatDetails.combatStats.maxHitpoints;
        this.combatDetails.maxManapoints =
            10 * (10 + this.combatDetails.intelligenceLevel) + this.combatDetails.combatStats.maxManapoints;

        let accuracyRatioBoost = this.getBuffBoost("/buff_types/accuracy").ratioBoost;
        let damageRatioBoost = this.getBuffBoost("/buff_types/damage").ratioBoost;

        ["stab", "slash", "smash"].forEach((style) => {
            this.combatDetails[style + "AccuracyRating"] =
                (10 + this.combatDetails.attackLevel) *
                (1 + this.combatDetails.combatStats[style + "Accuracy"]) *
                (1 + accuracyRatioBoost);
            this.combatDetails[style + "MaxDamage"] =
                (10 + this.combatDetails.powerLevel) *
                (1 + this.combatDetails.combatStats[style + "Damage"]) *
                (1 + damageRatioBoost);
            this.combatDetails[style + "EvasionRating"] =
                (10 + this.combatDetails.defenseLevel) * (1 + this.combatDetails.combatStats[style + "Evasion"]);
        });

        this.combatDetails.rangedAccuracyRating =
            (10 + this.combatDetails.rangedLevel) *
            (1 + this.combatDetails.combatStats.rangedAccuracy) *
            (1 + accuracyRatioBoost);
        this.combatDetails.rangedMaxDamage =
            (10 + this.combatDetails.rangedLevel) *
            (1 + this.combatDetails.combatStats.rangedDamage) *
            (1 + damageRatioBoost);
        this.combatDetails.rangedEvasionRating =
            (10 + this.combatDetails.defenseLevel) * (1 + this.combatDetails.combatStats.rangedEvasion);

        this.combatDetails.magicMaxDamage =
            (10 + this.combatDetails.magicLevel) *
            (1 + this.combatDetails.combatStats.magicDamage) *
            (1 + damageRatioBoost);

        this.combatDetails.combatStats.physicalAmplify += this.getBuffBoost("/buff_types/physical_amplify").flatBoost;
        this.combatDetails.combatStats.waterAmplify += this.getBuffBoost("/buff_types/water_amplify").flatBoost;
        this.combatDetails.combatStats.natureAmplify += this.getBuffBoost("/buff_types/nature_amplify").flatBoost;
        this.combatDetails.combatStats.fireAmplify += this.getBuffBoost("/buff_types/fire_amplify").flatBoost;

        let attackIntervalBoosts = this.getBuffBoosts("/buff_types/attack_speed");
        let attackIntervalRatioBoost = attackIntervalBoosts
            .map((boost) => boost.ratioBoost)
            .reduce((prev, cur) => prev + cur, 0);
        this.combatDetails.combatStats.attackInterval =
            this.combatDetails.combatStats.attackInterval * (1 / (1 + attackIntervalRatioBoost));

        let baseArmor = 0.2 * this.combatDetails.defenseLevel + this.combatDetails.combatStats.armor;
        this.combatDetails.totalArmor = baseArmor;
        let armorBoosts = this.getBuffBoosts("/buff_types/armor");
        for (const boost of armorBoosts) {
            this.combatDetails.totalArmor += boost.flatBoost;
            this.combatDetails.totalArmor += baseArmor * boost.ratioBoost;
        }

        let baseWaterResistance =
            0.1 * this.combatDetails.defenseLevel +
            0.3 * this.combatDetails.magicLevel +
            this.combatDetails.combatStats.waterResistance;
        this.combatDetails.totalWaterResistance = baseWaterResistance;
        let waterResistanceBoosts = this.getBuffBoosts("/buff_types/water_resistance");
        for (const boost of waterResistanceBoosts) {
            this.combatDetails.totalWaterResistance += boost.flatBoost;
            this.combatDetails.totalWaterResistance += baseWaterResistance * boost.ratioBoost;
        }

        let baseNatureResistance =
            0.1 * this.combatDetails.defenseLevel +
            0.3 * this.combatDetails.magicLevel +
            this.combatDetails.combatStats.natureResistance;
        this.combatDetails.totalNatureResistance = baseNatureResistance;
        let natureResistanceBoosts = this.getBuffBoosts("/buff_types/nature_resistance");
        for (const boost of natureResistanceBoosts) {
            this.combatDetails.totalNatureResistance += boost.flatBoost;
            this.combatDetails.totalNatureResistance += baseNatureResistance * boost.ratioBoost;
        }

        let baseFireResistance =
            0.1 * this.combatDetails.defenseLevel +
            0.3 * this.combatDetails.magicLevel +
            this.combatDetails.combatStats.fireResistance;
        this.combatDetails.totalFireResistance = baseFireResistance;
        let fireResistanceBoosts = this.getBuffBoosts("/buff_types/fire_resistance");
        for (const boost of fireResistanceBoosts) {
            this.combatDetails.totalFireResistance += boost.flatBoost;
            this.combatDetails.totalFireResistance += baseFireResistance * boost.ratioBoost;
        }

        this.combatDetails.combatStats.lifeSteal += this.getBuffBoost("/buff_types/life_steal").flatBoost;
        this.combatDetails.combatStats.HPRegen += this.getBuffBoost("/buff_types/hp_regen").flatBoost;
        this.combatDetails.combatStats.MPRegen += this.getBuffBoost("/buff_types/mp_regen").flatBoost;
        this.combatDetails.combatStats.physicalReflectPower += this.getBuffBoost(
            "/buff_types/physical_reflect_power"
        ).flatBoost;
        this.combatDetails.combatStats.dropRate += this.getBuffBoost("/buff_types/combat_drop_rate").ratioBoost;
        this.combatDetails.combatStats.experienceRate += this.getBuffBoost("/buff_types/wisdom").flatBoost;
    }

    addBuff(buff, currentTime) {
        buff.startTime = currentTime;
        this.combatBuffs[buff.sourceHrid] = buff;

        this.updateCombatDetails();
    }

    removeExpiredBuffs(currentTime) {
        let expiredBuffs = Object.values(this.combatBuffs).filter(
            (buff) => buff.startTime + buff.duration <= currentTime
        );
        expiredBuffs.forEach((buff) => {
            delete this.combatBuffs[buff.sourceHrid];
        });

        this.updateCombatDetails();
    }

    clearBuffs() {
        this.combatBuffs = {};
        this.updateCombatDetails();
    }

    getBuffBoosts(type) {
        let boosts = [];
        Object.values(this.combatBuffs)
            .filter((buff) => buff.typeHrid == type)
            .forEach((buff) => {
                boosts.push({ ratioBoost: buff.ratioBoost, flatBoost: buff.flatBoost });
            });

        return boosts;
    }

    getBuffBoost(type) {
        let boosts = this.getBuffBoosts(type);

        if (boosts.length > 1) {
            throw new Error("Using getBuffBoost with multiple buffs active: " + type);
        }

        let boost = {
            ratioBoost: boosts[0]?.ratioBoost ?? 0,
            flatBoost: boosts[0]?.flatBoost ?? 0,
        };

        return boost;
    }

    reset(currentTime = 0) {
        this.isStunned = false;
        this.stunExpireTime = null;

        this.clearBuffs();
        this.updateCombatDetails();
        this.resetCooldowns(currentTime);

        this.combatDetails.currentHitpoints = this.combatDetails.maxHitpoints;
        this.combatDetails.currentManapoints = this.combatDetails.maxManapoints;
    }

    resetCooldowns(currentTime = 0) {
        this.food.filter((food) => food != null).forEach((food) => (food.lastUsed = Number.MIN_SAFE_INTEGER));
        this.drinks.filter((drink) => drink != null).forEach((drink) => (drink.lastUsed = Number.MIN_SAFE_INTEGER));

        this.abilities
            .filter((ability) => ability != null)
            .forEach((ability) => {
                if (this.isPlayer) {
                    ability.lastUsed = Number.MIN_SAFE_INTEGER;
                } else {
                    ability.lastUsed = currentTime - Math.floor(Math.random() * ability.cooldownDuration);
                }
            });
    }

    addHitpoints(hitpoints) {
        let hitpointsAdded = 0;

        if (this.combatDetails.currentHitpoints >= this.combatDetails.maxHitpoints) {
            return hitpointsAdded;
        }

        let newHitpoints = Math.min(this.combatDetails.currentHitpoints + hitpoints, this.combatDetails.maxHitpoints);
        hitpointsAdded = newHitpoints - this.combatDetails.currentHitpoints;
        this.combatDetails.currentHitpoints = newHitpoints;

        return hitpointsAdded;
    }

    addManapoints(manapoints) {
        let manapointsAdded = 0;

        if (this.combatDetails.currentManapoints >= this.combatDetails.maxManapoints) {
            return manapointsAdded;
        }

        let newManapoints = Math.min(
            this.combatDetails.currentManapoints + manapoints,
            this.combatDetails.maxManapoints
        );
        manapointsAdded = newManapoints - this.combatDetails.currentManapoints;
        this.combatDetails.currentManapoints = newManapoints;

        return manapointsAdded;
    }
}

export default CombatUnit;
