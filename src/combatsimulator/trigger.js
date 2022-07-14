import combatTriggerDependencyDetailMap from "./data/combatTriggerDependencyDetailMap.json";

class Trigger {
    constructor(dependencyHrid, conditionHrid, comparatorHrid, value = 0) {
        this.dependencyHrid = dependencyHrid;
        this.conditionHrid = conditionHrid;
        this.comparatorHrid = comparatorHrid;
        this.value = value;
    }

    isActive(source, target, friendlies, enemies) {
        if (combatTriggerDependencyDetailMap[this.dependencyHrid].isSingleTarget) {
            return this.isActiveSingleTarget(source, target);
        } else {
            return this.isActiveMultiTarget(friendlies, enemies);
        }
    }

    isActiveSingleTarget(source, target) {
        let dependencyValue;
        switch (this.dependencyHrid) {
            case "/combat_trigger_dependencies/self":
                dependencyValue = this.getDependencyValue(source);
                break;
            case "/combat_trigger_dependencies/targeted_enemy":
                dependencyValue = this.getDependencyValue(target);
                break;
        }

        return this.compareValue(dependencyValue);
    }

    isActiveMultiTarget(friendlies, enemies) {
        let dependency;
        switch (this.dependencyHrid) {
            case "/combat_trigger_dependencies/all_allies":
                dependency = friendlies;
                break;
            case "/combat_trigger_dependencies/all_enemies":
                dependency = enemies;
                break;
        }

        let dependencyValue;
        switch (this.conditionHrid) {
            case "/combat_trigger_conditions/number_of_active_units":
                dependencyValue = dependency.filter((unit) => unit.combatStats.currentHitpoints > 0).length;
                break;
            default:
                dependencyValue = dependency
                    .map((unit) => this.getDependencyValue(unit))
                    .reduce((prev, cur) => prev + cur, 0);
                break;
        }

        return this.compareValue(dependencyValue);
    }

    getDependencyValue(source) {
        switch (this.conditionHrid) {
            case "/combat_trigger_conditions/attack_coffee":
            case "/combat_trigger_conditions/berserk":
            case "/combat_trigger_conditions/defense_coffee":
            case "/combat_trigger_conditions/frenzy":
            case "/combat_trigger_conditions/intelligence_coffee":
            case "/combat_trigger_conditions/lucky_coffee":
            case "/combat_trigger_conditions/power_coffee":
            case "/combat_trigger_conditions/precision":
            case "/combat_trigger_conditions/stamina_coffee":
            case "/combat_trigger_conditions/super_attack_coffee":
            case "/combat_trigger_conditions/super_defense_coffee":
            case "/combat_trigger_conditions/super_intelligence_coffee":
            case "/combat_trigger_conditions/super_power_coffee":
            case "/combat_trigger_conditions/super_stamina_coffee":
            case "/combat_trigger_conditions/swiftness_coffee":
            case "/combat_trigger_conditions/toughness":
            case "/combat_trigger_conditions/vampirism":
                let buffHrid = "/buff_sources";
                buffHrid += this.conditionHrid.slice(this.conditionHrid.lastIndexOf("/"));
                return source.combatBuffs[buffHrid];
            case "/combat_trigger_conditions/current_hp":
                return source.combatStats.currentHitpoints;
            case "/combat_trigger_conditions/current_mp":
                return source.combatStats.currentManapoints;
            case "/combat_trigger_conditions/missing_hp":
                return source.combatStats.maxHitpoints - source.combatStats.currentHitpoints;
            case "/combat_trigger_conditions/missing_mp":
                return source.combatStats.maxManapoints - source.combatStats.currentManapoints;
        }
    }

    compareValue(dependencyValue) {
        switch (this.comparatorHrid) {
            case "/combat_trigger_comparators/greater_than_equal":
                return dependencyValue >= this.value;
            case "/combat_trigger_comparators/less_than_equal":
                return dependencyValue <= this.value;
            case "/combat_trigger_comparators/is_active":
                return !!dependencyValue;
            case "/combat_trigger_comparators/is_inactive":
                return !dependencyValue;
        }
    }
}

export default Trigger;
