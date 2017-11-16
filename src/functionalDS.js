import { List } from 'immutable';
import { IReadContext, IWriteContext, IDataStore } from './interfaces';
import { toConstraintEnforcer} from './constraints';
import ImmutableSnapshot from './immutableSnapshot';

// Operation types
const CREATE = 'Create'; // { record: record }

class Operation {
    constructor(type, data) {
        this.type = type;
        this.data = data;
    }
}

function applyOperation(operation, snapshot) {
    switch (operation.type) {
        case CREATE:
            return snapshot.createObject(operation.data.record);

        default:
            throw new Error(`Invalid Operation Type: ${operation.type}`)
    }
}

class TransactionContext extends IWriteContext {
    constructor(initialSnapshot) {
        super();

        this.currentSnapshot = initialSnapshot;
        this.operations = [];
    }

    retrieveWhere(condition) {
        return this.currentSnapshot.retrieveWhere(condition);
    }

    createObject(record) {
        const operation = new Operation(CREATE, { record: record });
        this.currentSnapshot = applyOperation(operation, this.currentSnapshot);
        this.operations.push(operation);
    }

    commitTo(otherSnapshot) {
        let currentIterationSnapshot = otherSnapshot;
        for (let i = 0; i < this.operations.length; i++) {
            currentIterationSnapshot = applyOperation(this.operations[i], currentIterationSnapshot)
        }

        return currentIterationSnapshot;
    }
}

export default class DataStore extends IDataStore {
    constructor(constraints) {
        super();

        this.currentSnapshot = new ImmutableSnapshot(new List(), (constraints || []).map(toConstraintEnforcer));
    }

    read(fReader) {
        const self = this;

        class ReadContext extends IReadContext {
            retrieveWhere(condition) {
                return self.currentSnapshot.retrieveWhere(condition);
            }
        }

        return fReader(new ReadContext());
    }

    write(fWriter) {
        const transaction = new TransactionContext(this.currentSnapshot);
        fWriter(transaction);
        this.currentSnapshot = transaction.commitTo(this.currentSnapshot);
    }
}
