import { BulkOperationType } from '@azure/cosmos';
import { expect } from 'chai';

import * as helper from '../../../modules/database/cosmosdb/cosmosdb.helper';

describe('cosmosdb helper', () => {
    describe('getBulkOps', () => {
        it('should split into bulks of batched ops when 100 ops exceeded', () => {
            const incomingItemOps = Array.from({ length: 101 })
            const ops = helper.getBulkOps(incomingItemOps, BulkOperationType.Upsert);

            expect(ops.length).to.equal(2);
            expect(ops[0].ops.length).to.equal(100);
            expect(ops[1].ops.length).to.equal(1);
        })

        it('should not split into bulks of batched ops when 100 ops exactly', () => {
            const incomingItemOps = Array.from({ length: 100 })
            const ops = helper.getBulkOps(incomingItemOps, BulkOperationType.Upsert);

            expect(ops.length).to.equal(1);
            expect(ops[0].ops.length).to.equal(100);
        })

        it('should not split into bulks of batched ops when less than 100 ops', () => {
            const incomingItemOps = Array.from({ length: 50 })
            const ops = helper.getBulkOps(incomingItemOps, BulkOperationType.Upsert);

            expect(ops.length).to.equal(1);
            expect(ops[0].ops.length).to.equal(50);
        })
    })
})