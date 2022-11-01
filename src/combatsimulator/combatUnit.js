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

    abilities = [null, null, null, null];
    food = [null, null, null];
    drinks = [null, null, null];

    // Calculated combat stats including temporary buffs
    combatDetails = {
        combatStyleHrid: "smash",
        attackInterval: 3000000000,
        stabAccuracy: 0,
        slashAccuracy: 0,
        smashAccuracy: 0,
        stabDamage: 0,
        slashDamage: 0,
        smashDamage: 0,
        stabEvasion: 0,
        slashEvasion: 0,
        smashEvasion: 0,
        armor: 0,
        lifeSteal: 0,
        physicalReflectPower: 0,
        HPRegen: 0.01,
        MPRegen: 0.01,
        dropRate: 0,
        experienceRate: 0,
        foodSlots: 1,
        drinkSlots: 1,
        staminaLevel: 1,
        intelligenceLevel: 1,
        attackLevel: 1,
        powerLevel: 1,
        defenseLevel: 1,
        maxHitpoints: 110,
        currentHitpoints: 110,
        maxManapoints: 110,
        currentManapoints: 110,
        stabAccuracyRating: 11,
        slashAccuracyRating: 11,
        smashAccuracyRating: 11,
        stabMaxDamage: 11,
        slashMaxDamage: 11,
        smashMaxDamage: 11,
        stabEvasionRating: 11,
        slashEvasionRating: 11,
        smashEvasionRating: 11,
    };
    combatBuffs = {};

    constructor() {}

    updateCombatDetails() {
        this.combatDetails.HPRegen = 0.01;
        this.combatDetails.MPRegen = 0.01;

        ["stamina", "intelligence", "attack", "power", "defense"].forEach((stat) => {
            this.combatDetails[stat + "Level"] = this[stat + "Level"];
            let boosts = this.getBuffBoosts("/buff_types/" + stat + "_level");
            boosts.forEach((buff) => {
                this.combatDetails[stat + "Level"] += Math.floor(this[stat + "Level"] * buff.ratioBoost);
                this.combatDetails[stat + "Level"] += buff.flatBoost;
            });
        });

        this.combatDetails.maxHitpoints = 10 * (10 + this.combatDetails.staminaLevel);
        this.combatDetails.maxManapoints = 10 * (10 + this.combatDetails.intelligenceLevel);

        let accuracyBoosts = this.getBuffBoosts("/buff_types/accuracy");
        let accuracyRatioBoost = accuracyBoosts[0]?.ratioBoost ?? 0;

        let damageBoosts = this.getBuffBoosts("/buff_types/damage");
        let damageRatioBoost = damageBoosts[0]?.ratioBoost ?? 0;

        ["stab", "slash", "smash"].forEach((style) => {
            this.combatDetails[style + "AccuracyRating"] =
                (10 + this.combatDetails.attackLevel) *
                (1 + this.combatDetails[style + "Accuracy"]) *
                (1 + accuracyRatioBoost);
            this.combatDetails[style + "MaxDamage"] =
                (10 + this.combatDetails.powerLevel) * (1 + this.combatDetails[style + "Damage"]) * (1 + damageRatioBoost);
            this.combatDetails[style + "EvasionRating"] =
                (10 + this.combatDetails.defenseLevel) * (1 + this.combatDetails[style + "Evasion"]);
        });

        let attackIntervalBoosts = this.getBuffBoosts("/buff_types/attack_speed");
        let attackIntervalRatioBoost = attackIntervalBoosts
            .map((boost) => boost.ratioBoost)
            .reduce((prev, cur) => prev + cur, 0);
        this.combatDetails.attackInterval = this.combatDetails.attackInterval * (1 / (1 + attackIntervalRatioBoost));

        let armorBoosts = this.getBuffBoosts("/buff_types/armor");
        let armorFlatBoost = armorBoosts[0]?.flatBoost ?? 0;
        this.combatDetails.armor += armorFlatBoost;

        let lifeStealBoosts = this.getBuffBoosts("/buff_types/life_steal");
        let lifeStealFlatBoost = lifeStealBoosts[0]?.flatBoost ?? 0;
        this.combatDetails.lifeSteal += lifeStealFlatBoost;

        let physicalReflectPowerBoosts = this.getBuffBoosts("/buff_types/physical_reflect_power");
        let physicalReflectPowerFlatBoost = physicalReflectPowerBoosts[0]?.flatBoost ?? 0;
        this.combatDetails.physicalReflectPower += physicalReflectPowerFlatBoost;

        let HPRegenBoosts = this.getBuffBoosts("/buff_types/hp_regen");
        let HPRegenFlatBoost = HPRegenBoosts[0]?.flatBoost ?? 0;
        this.combatDetails.HPRegen += HPRegenFlatBoost;

        let MPRegenBoosts = this.getBuffBoosts("/buff_types/mp_regen");
        let MPRegenFlatBoost = MPRegenBoosts[0]?.flatBoost ?? 0;
        this.combatDetails.MPRegen += MPRegenFlatBoost;

        let dropRateBoosts = this.getBuffBoosts("/buff_types/combat_drop_rate");
        let dropRateRatioBoost = dropRateBoosts[0]?.ratioBoost ?? 0;
        this.combatDetails.dropRate += dropRateRatioBoost;

        let experienceRateBoosts = this.getBuffBoosts("/buff_types/wisdom");
        let experienceRateFlatBoost = experienceRateBoosts[0]?.flatBoost ?? 0;
        this.combatDetails.experienceRate += experienceRateFlatBoost;
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

        let newManapoints = Math.min(this.combatDetails.currentManapoints + manapoints, this.combatDetails.maxManapoints);
        manapointsAdded = newManapoints - this.combatDetails.currentManapoints;
        this.combatDetails.currentManapoints = newManapoints;

        return manapointsAdded;
    }
}

export default CombatUnit;
