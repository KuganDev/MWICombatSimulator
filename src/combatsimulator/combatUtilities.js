class CombatUtilities {
    static getTarget(enemies) {
        let target = enemies.find((enemy) => enemy.combatStats.currentHitpoints > 0);
        console.assert(target, "No valid target found in enemy list");

        return target;
    }

    static randomInt(min, max) {
        return Math.floor(min + Math.random() * (max - min + 1));
    }
}

export default CombatUtilities;
