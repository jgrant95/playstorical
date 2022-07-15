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
exports.getUpsertOp = exports.getContainerAsync = void 0;
function getContainerAsync(client, databaseId, containerId) {
    return __awaiter(this, void 0, void 0, function* () {
        const { database } = yield client.databases.createIfNotExists({ id: databaseId });
        console.time('get-container');
        const container = database.container(containerId);
        console.timeEnd('get-container');
        return container;
    });
}
exports.getContainerAsync = getContainerAsync;
function getUpsertOp(item, partitionKey) {
    return {
        operationType: "Upsert",
        partitionKey: partitionKey ? item[partitionKey] : undefined,
        resourceBody: item,
    };
}
exports.getUpsertOp = getUpsertOp;
