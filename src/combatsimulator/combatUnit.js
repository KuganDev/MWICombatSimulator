class CombatUnit {
    player = true;

    // Base levels which don't change after initialization
    staminaLevel = 1;
    intelligenceLevel = 1;
    attackLevel = 1;
    powerLevel = 1;
    defenseLevel = 1;

    // Calculated combat stats including temporary buffs
    combatStats = {
        combatStyleHrid: "/combat_styles/smash",
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
        HPRegen: 0.005,
        MPRegen: 0.01,
        dropRate: 0,
        foodSlots: 1,
        drinkSlots: 0,
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

        let damageBoosts = this.getBuffBoosts("/buff_types/damage");
        let damageRatioBoost = damageBoosts[0]?.ratioBoost ?? 0;

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

        // TODO: Test how frenzy and swiftness coffee stack
        let attackIntervalBoosts = this.getBuffBoosts("/buff_types/attack_speed");
        let attackIntervalRatioBoost = attackIntervalBoosts
            .map((boost) => boost.ratioBoost)
            .reduce((prev, cur) => prev + cur, 0);
        this.combatStats.attackInterval = this.combatStats.attackInterval * (1 / (1 + attackIntervalRatioBoost));

        let armorBoosts = this.getBuffBoosts("/buff_types/armor");
        let armorFlatBoost = armorBoosts[0]?.flatBoost ?? 0;
        this.combatStats.armor += armorFlatBoost;

        let lifeStealBoosts = this.getBuffBoosts("/buff_types/life_steal");
        let lifeStealFlatBoost = lifeStealBoosts[0]?.flatBoost ?? 0;
        this.combatStats.lifeSteal += lifeStealFlatBoost;

        let HPRegenBoosts = this.getBuffBoosts("/buff_types/hp_regen");
        let HPRegenFlatBoost = HPRegenBoosts[0]?.flatBoost ?? 0;
        this.combatStats.HPRegen += HPRegenFlatBoost;

        let MPRegenBoosts = this.getBuffBoosts("/buff_types/mp_regen");
        let MPRegenFlatBoost = MPRegenBoosts[0]?.flatBoost ?? 0;
        this.combatStats.MPRegen += MPRegenFlatBoost;

        let dropRateBoosts = this.getBuffBoosts("/buff_types/combat_drop_rate");
        let dropRateRatioBoost = dropRateBoosts[0]?.ratioBoost ?? 0;
        this.combatStats.dropRate += dropRateRatioBoost;
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

    getBuffBoosts(type) {
        let boosts = [];
        Object.values(this.combatBuffs)
            .filter((buff) => buff.typeHrid == type)
            .forEach((buff) => {
                boosts.push({ ratioBoost: buff.ratioBoost, flatBoost: buff.flatBoost });
            });

        return boosts;
    }

    reset() {
        this.combatBuffs = {};
        this.updateCombatStats();

        this.combatStats.currentHitpoints = this.combatStats.maxHitpoints;
        this.combatStats.currentManapoints = this.combatStats.maxManapoints;
    }
}

export default CombatUnit;
