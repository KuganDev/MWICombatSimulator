class CombatUnit {
    isPlayer;
    isStunned;

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
    combatStats = {
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
        HPRegen: 0.01,
        MPRegen: 0.01,
        dropRate: 0,
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

    updateCombatStats() {
        this.combatStats.HPRegen = 0.01;
        this.combatStats.MPRegen = 0.01;

        ["stamina", "intelligence", "attack", "power", "defense"].forEach((stat) => {
            this.combatStats[stat + "Level"] = this[stat + "Level"];
            let boosts = this.getBuffBoosts("/buff_types/" + stat + "_level");
            boosts.forEach((buff) => {
                this.combatStats[stat + "Level"] += Math.floor(this[stat + "Level"] * buff.ratioBoost);
                this.combatStats[stat + "Level"] += buff.flatBoost;
            });
        });

        this.combatStats.maxHitpoints = 10 * (10 + this.combatStats.staminaLevel);
        this.combatStats.maxManapoints = 10 * (10 + this.combatStats.intelligenceLevel);

        let accuracyBoosts = this.getBuffBoosts("/buff_types/accuracy");
        let accuracyRatioBoost = accuracyBoosts[0]?.ratioBoost ?? 0;
        console.assert(accuracyBoosts.length <= 1, "Multiple accuracy buffs active");

        let damageBoosts = this.getBuffBoosts("/buff_types/damage");
        let damageRatioBoost = damageBoosts[0]?.ratioBoost ?? 0;
        console.assert(damageBoosts.length <= 1, "Multiple damage buffs active");

        ["stab", "slash", "smash"].forEach((style) => {
            this.combatStats[style + "AccuracyRating"] =
                (10 + this.combatStats.attackLevel) *
                (1 + this.combatStats[style + "Accuracy"]) *
                (1 + accuracyRatioBoost);
            this.combatStats[style + "MaxDamage"] =
                (10 + this.combatStats.powerLevel) * (1 + this.combatStats[style + "Damage"]) * (1 + damageRatioBoost);
            this.combatStats[style + "EvasionRating"] =
                (10 + this.combatStats.defenseLevel) * (1 + this.combatStats[style + "Evasion"]);
        });

        let attackIntervalBoosts = this.getBuffBoosts("/buff_types/attack_speed");
        let attackIntervalRatioBoost = attackIntervalBoosts
            .map((boost) => boost.ratioBoost)
            .reduce((prev, cur) => prev + cur, 0);
        this.combatStats.attackInterval = this.combatStats.attackInterval * (1 / (1 + attackIntervalRatioBoost));

        let armorBoosts = this.getBuffBoosts("/buff_types/armor");
        let armorFlatBoost = armorBoosts[0]?.flatBoost ?? 0;
        this.combatStats.armor += armorFlatBoost;
        console.assert(armorBoosts.length <= 1, "Multiple armor buffs active");

        let lifeStealBoosts = this.getBuffBoosts("/buff_types/life_steal");
        let lifeStealFlatBoost = lifeStealBoosts[0]?.flatBoost ?? 0;
        this.combatStats.lifeSteal += lifeStealFlatBoost;
        console.assert(lifeStealBoosts.length <= 1, "Multiple life steal buffs active");

        let HPRegenBoosts = this.getBuffBoosts("/buff_types/hp_regen");
        let HPRegenFlatBoost = HPRegenBoosts[0]?.flatBoost ?? 0;
        this.combatStats.HPRegen += HPRegenFlatBoost;
        console.assert(HPRegenBoosts.length <= 1, "Multiple hp regen buffs active");

        let MPRegenBoosts = this.getBuffBoosts("/buff_types/mp_regen");
        let MPRegenFlatBoost = MPRegenBoosts[0]?.flatBoost ?? 0;
        this.combatStats.MPRegen += MPRegenFlatBoost;
        console.assert(MPRegenBoosts.length <= 1, "Multiple mp regen buffs active");

        let dropRateBoosts = this.getBuffBoosts("/buff_types/combat_drop_rate");
        let dropRateRatioBoost = dropRateBoosts[0]?.ratioBoost ?? 0;
        this.combatStats.dropRate += dropRateRatioBoost;
        console.assert(dropRateBoosts.length <= 1, "Multiple drop rate buffs active");
    }

    addBuff(buff, currentTime) {
        buff.startTime = currentTime;
        this.combatBuffs[buff.sourceHrid] = buff;

        this.updateCombatStats();
    }

    removeExpiredBuffs(currentTime) {
        let expiredBuffs = Object.values(this.combatBuffs).filter(
            (buff) => buff.startTime + buff.duration <= currentTime
        );
        expiredBuffs.forEach((buff) => {
            delete this.combatBuffs[buff.sourceHrid];
        });

        this.updateCombatStats();
    }

    clearBuffs() {
        this.combatBuffs = {};
        this.updateCombatStats();
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

        this.clearBuffs();
        this.updateCombatStats();
        this.resetCooldowns(currentTime);

        this.combatStats.currentHitpoints = this.combatStats.maxHitpoints;
        this.combatStats.currentManapoints = this.combatStats.maxManapoints;
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

        if (this.combatStats.currentHitpoints >= this.combatStats.maxHitpoints) {
            return hitpointsAdded;
        }

        let newHitpoints = Math.min(this.combatStats.currentHitpoints + hitpoints, this.combatStats.maxHitpoints);
        hitpointsAdded = newHitpoints - this.combatStats.currentHitpoints;
        this.combatStats.currentHitpoints = newHitpoints;

        return hitpointsAdded;
    }

    addManapoints(manapoints) {
        let manapointsAdded = 0;

        if (this.combatStats.currentManapoints >= this.combatStats.maxManapoints) {
            return manapointsAdded;
        }

        let newManapoints = Math.min(this.combatStats.currentManapoints + manapoints, this.combatStats.maxManapoints);
        manapointsAdded = newManapoints - this.combatStats.currentManapoints;
        this.combatStats.currentManapoints = newManapoints;

        return manapointsAdded;
    }
}

export default CombatUnit;
