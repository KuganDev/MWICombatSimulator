class CombatUnit {
    player = true;

    staminaLevel = 1;
    intelligenceLevel = 1;
    attackLevel = 1;
    powerLevel = 1;
    defenseLevel = 1;

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
        // TODO: Include buffs

        this.combatStats.maxHitpoints = 10 * (10 + this.staminaLevel);
        this.combatStats.maxManapoints = 10 * (10 + this.intelligenceLevel);

        ["stab", "slash", "smash"].forEach((style) => {
            this.combatStats[style + "AccuracyRating"] =
                (10 + this.attackLevel) * (1 + this.combatStats[style + "Accuracy"]);
            this.combatStats[style + "MaxDamage"] = (10 + this.powerLevel) * (1 + this.combatStats[style + "Damage"]);
            this.combatStats[style + "EvasionRating"] =
                (10 + this.defenseLevel) * (1 + this.combatStats[style + "Evasion"]);
        });
    }

    addBuff(buff, currentTime) {
        buff.startTime = currentTime;
        this.combatBuffs[buff.sourceHrid] = buff;
    }

    removeExpiredBuffs(currentTime) {
        let expiredBuffs = Object.values(this.combatBuffs).filter(
            (buff) => buff.startTime + buff.duration <= currentTime
        );
        expiredBuffs.forEach((buff) => {
            delete this.combatBuffs[buff.sourceHrid];
        });
    }

    reset() {
        this.combatBuffs = {};
        this.updateCombatStats();

        this.combatStats.currentHitpoints = this.combatStats.maxHitpoints;
        this.combatStats.currentManapoints = this.combatStats.currentManapoints;
    }
}

export default CombatUnit;
