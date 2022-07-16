class CombatUtilities {
    static getTarget(enemies) {
        let target = enemies.find((enemy) => enemy.combatStats.currentHitpoints > 0);
        console.assert(target, "No valid target found in enemy list");

        return target;
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
}

export default CombatUtilities;
