class CombatUtilities {
    static getTarget(enemies) {
        return enemies.find((enemy) => enemy.combatStats.currentHitpoints > 0);
    }

    static randomInt(min, max) {
        return Math.floor(min + Math.random() * (max - min + 1));
    }
}

export default CombatUtilities;