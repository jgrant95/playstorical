"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comosdb = void 0;
const cosmos_1 = require("@azure/cosmos");
const cosmosdb_helper_1 = require("./cosmosdb.helper");
const key = process.env.COSMOS_KEY || "gWwpHThNpxe8P74p19WDIwgo1Y4Pl7HMXoc13sGK7bsFzYPa8nc6Dd4V25ioR36RuiCdDwIngecZWxcyImdKpQ==";
const endpoint = process.env.COSMOS_ENDPOINT || "https://test-sql-1.documents.azure.com:443/";
const databaseId = process.env.COSMOS_DATABASE || "test-sql-2";
class Comosdb {
    constructor(opts) {
        this._cosmosdbClient = new cosmos_1.CosmosClient({ endpoint, key });
    }
    upsert(items, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const container = yield (0, cosmosdb_helper_1.getContainerAsync)(this._cosmosdbClient, databaseId, 'discovery');
            const batchedOps = items.reduce((arr, curr, index) => {
                var _a;
                let currentBatch = arr.length ? Math.max(...arr.map(x => x.batch)) : 0;
                // Add new batch with ops
                if (index % 100 === 0 || index == 1) {
                    currentBatch = currentBatch + 1;
                    arr.push({ batch: currentBatch, ops: [] });
                }
                const current = arr.find(x => x.batch === currentBatch);
                (_a = current === null || current === void 0 ? void 0 : current.ops) === null || _a === void 0 ? void 0 : _a.push((0, cosmosdb_helper_1.getUpsertOp)(curr, opts === null || opts === void 0 ? void 0 : opts.partitionKey));
                return arr;
            }, []);
            console.log(batchedOps.map(x => x.batch));
            const saveOps = (batchedOps, isRetry) => __awaiter(this, void 0, void 0, function* () {
                batchedOps.forEach((batch) => __awaiter(this, void 0, void 0, function* () {
                    console.log(`[UPSERT] Batch ${batch.batch} Started...`);
                    try {
                        const bulkUpsertResp = yield container.items.bulk(batch.ops);
                        const isFailedStatus = (res) => res.statusCode === 200 && res.statusCode === 201;
                        const failedUpserts = bulkUpsertResp.filter(isFailedStatus);
                        if (bulkUpsertResp.some(isFailedStatus)) {
                            console.error('Failed to upsert some of bulk ops.', bulkUpsertResp.map(r => { var _a; return (_a = r.resourceBody) === null || _a === void 0 ? void 0 : _a.id; }));
                            return;
                        }
                        yield saveOps([{
                                batch: batch.batch,
                                ops: failedUpserts.map(res => (0, cosmosdb_helper_1.getUpsertOp)(res.resourceBody, opts === null || opts === void 0 ? void 0 : opts.partitionKey))
                            }], true);
                        console.log(`[UPSERT] Batch ${batch.batch} Complete!`);
                    }
                    catch (e) {
                        console.log('Failed to bulk upsert', e);
                    }
                }));
            });
        });
    }
}
exports.Comosdb = Comosdb;
