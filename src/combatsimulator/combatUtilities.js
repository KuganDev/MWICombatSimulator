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

    static calculateTickValue(totalValue, totalTicks, currentTick) {
        let currentSum = Math.floor((currentTick * totalValue) / totalTicks);
        let previousSum = Math.floor(((currentTick - 1) * totalValue) / totalTicks);

        return currentSum - previousSum;
    }
}

export default CombatUtilities;
