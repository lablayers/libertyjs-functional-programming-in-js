import { Set } from 'immutable';

// Constraint Types
export const UNIQUE = 'Unique'; // { attr: 'Attribute Name' }

export class Constraint {
    constructor(type, data) {
        this.type = type;
        this.data = data;
    }
}

export class IConstraintEnforcer {
    createObject(record) {}
}

class UniqueConstraintEnforcer extends IConstraintEnforcer {
    constructor(constraintData, uniqueValues) {
        super();

        this.constraintData = constraintData;
        this.uniqueValues = uniqueValues || new Set();
    }

    createObject(record) {
        const attrValue = record[this.constraintData.attr];
        if (this.uniqueValues.includes(attrValue)) {
            throw new Error(`Unique Constraint on attribute ${this.constraintData.attr} violated by duplicate value ${attrValue}`);
        }
        else {
            return new UniqueConstraintEnforcer(this.constraintData, this.uniqueValues.add(attrValue));
        }
    }
}

export function toConstraintEnforcer(constraint) {
    switch (constraint.type) {
        case UNIQUE:
            return new UniqueConstraintEnforcer(constraint.data);

        default:
            throw new Error(`Unknown condition type: ${constraint.type}`);
    }
}
