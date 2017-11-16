// Condition types
export const ALL = 'All'; // no data
export const EQUALS = 'Equals'; // { attr: 'Attribute Name', value: 'Attribute Value' }

export class Condition {
    constructor(type, data) {
        this.type = type;
        this.data = data;
    }
}

function greedyPredicate(record) { return true; }

export function toPredicate(condition) {
    if (!condition) {
        // Return a special predicate that accepts all records
        return greedyPredicate;
    } else {
        switch (condition.type) {
            case ALL:
                return greedyPredicate;

            case EQUALS:
                return function(record) {
                    return record[condition.data.attr] === condition.data.value;
                };

            default:
                throw new Error(`Unknown condition type: ${condition.type}`);
        }
    }
}
