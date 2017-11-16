import { assert, expect } from 'chai';
import { SimpleDataStore, FunctionalDataStore, Conditions, Constraints } from '../src/index';

describe('This Project', () => {
    it('Contains the SimpleDataStore class', () => assert(SimpleDataStore !== null));
});

describe('Conditions.toPredicate', () => {
    it('returns the same thing for null and the ALL Condition', () => {
        assert(Conditions.toPredicate() === Conditions.toPredicate(new Conditions.Condition(Conditions.ALL)));
    });

    it('throws errors that tell you what you might have done wrong', () => {
        expect(() => Conditions.toPredicate(new Conditions.Condition('MadeUpValue'))).to.throw(Error, /MadeUpValue/);
    })
});

function testDataStore(dataStore) {
    it('Allows records to be added', () => {
        dataStore.write(ctx => {
            ctx.createObject({ id: 1});
            ctx.createObject({ id: 2});
            ctx.createObject({ id: 3});
        })
    });

    it('allows retrieval of all records', () => {
        assert(dataStore.read(ctx => ctx.retrieveWhere()).length === 3);
    });

    it('allows query for specific record', () => {
        const condition = new Conditions.Condition(Conditions.EQUALS, {attr: 'id', value: 2});
        const matchingRecords = dataStore.read(ctx => ctx.retrieveWhere(condition));

        assert(matchingRecords.length === 1);
        assert(matchingRecords[0].id === 2);
    });
}

describe('SimpleDataStore', () => testDataStore(new SimpleDataStore()));
describe('FunctionalDataStore', () => testDataStore(new FunctionalDataStore()));
describe('Constrained FunctionalDataStore', () => {
    // Constrained Data Store tests
    const dataStore = new FunctionalDataStore([ new Constraints.Constraint(Constraints.UNIQUE, { attr: 'id' }) ]);

    testDataStore(dataStore);

    // Additional tests
    it('Prevents duplicate records from being added', () => {
        expect(() => dataStore.write(ctx => {
            ctx.createObject({ id: 1});
        })).to.throw(Error, 'Unique Constraint on attribute id violated by duplicate value 1');
    });

    it('isolates transactions', () => {
        dataStore.write(outerTransactionContext => {
            outerTransactionContext.createObject({id: 4});

            // Retrieve the record we just added to the OUTER transaction
            expect(outerTransactionContext.retrieveWhere()).to.have.lengthOf(4);

            // Dirty trick - make a new top-level transaction before the first one has committed
            dataStore.write(innerTransactionContext => {
                // New INNER transaction where the OUTER transaction hasn't been committed yet
                expect(innerTransactionContext.retrieveWhere()).to.have.lengthOf(3);

                innerTransactionContext.createObject({id: 5});

                // Now our INNER transaction will have 4 records also
                expect(innerTransactionContext.retrieveWhere()).to.have.lengthOf(4);

                // Our OUTER transaction still has 4 (and neither has been committed)
                expect(outerTransactionContext.retrieveWhere()).to.have.lengthOf(4);
            });

            // If we hit the DataStore from the outside, it will now have 4 records because our INNER transaction was just committed
            expect(dataStore.read(ctx => ctx.retrieveWhere())).to.have.lengthOf(4);
        });

        // If we hit the DataStore from the outside, it will now have 5 records because our OUTER transaction was just committed
        expect(dataStore.read(ctx => ctx.retrieveWhere())).to.have.lengthOf(5);
    });

    it('rolls back failed transactions', () => {
        // If we hit the DataStore from the outside, it will still have 5 records because of the previous test
        expect(dataStore.read(ctx => ctx.retrieveWhere())).to.have.lengthOf(5);

        expect(() => {
            dataStore.write(outerTransactionContext => {
                outerTransactionContext.createObject({id: 6});
                outerTransactionContext.createObject({id: 6});
            });
        }).to.throw(Error, 'Unique Constraint on attribute id violated by duplicate value 6');

        // If we hit the DataStore from the outside, it will still have 5 records because of the previous test
        expect(dataStore.read(ctx => ctx.retrieveWhere())).to.have.lengthOf(5);
    });


    it('enforces constraints on transaction commit', () => {
        let committedFirstTransaction = false;

        expect(() => {
            dataStore.write(outerTransactionContext => {
                outerTransactionContext.createObject({id: 6});

                // Dirty trick - make a new top-level transaction before the first one has committed
                dataStore.write(innerTransactionContext => {
                    // This duplicate is ok because nothing has been committed yet
                    innerTransactionContext.createObject({id: 6});
                });

                committedFirstTransaction = true;
            });
        }).to.throw(Error, 'Unique Constraint on attribute id violated by duplicate value 6');

        assert(committedFirstTransaction);
    });
});
