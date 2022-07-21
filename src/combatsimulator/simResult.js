class SimResult {
    constructor() {
        this.deaths = {};
        this.experienceGained = {};
        this.encounters = 0;
    }

    addDeath(unit) {
        if (!this.deaths[unit.hrid]) {
            this.deaths[unit.hrid] = 0;
        }

        this.deaths[unit.hrid] += 1;
    }

    addExperienceGain(unit, type, experience) {
        if (!unit.isPlayer) {
            return;
        }

        if (!this.experienceGained[unit.hrid]) {
            this.experienceGained[unit.hrid] = {
                stamina: 0,
                intelligence: 0,
                attack: 0,
                power: 0,
                defense: 0,
            };
        }

        this.experienceGained[unit.hrid][type] += experience;
    }

    addEncounterEnd() {
        this.encounters++;
    }
}

export default SimResult;
