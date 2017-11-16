import { List } from 'immutable';
import { toPredicate} from './conditions';

export default class ImmutableSnapshot {
    constructor(records, constraintEnforcers) {
        this.records = records || new List();
        this.constraintEnforcers = constraintEnforcers;
    }

    retrieveWhere(condition) {
        return this.records.filter(toPredicate(condition)).toJS();
    }

    createObject(record) {
        const nextRecords = this.records.push(record);
        const nextConstraintEnforcers = this.constraintEnforcers.map(enforcer => enforcer.createObject(record));

        return new ImmutableSnapshot(nextRecords, nextConstraintEnforcers);
    }
}
