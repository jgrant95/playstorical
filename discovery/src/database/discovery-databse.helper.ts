import { DiscoveryDbProvider } from "models/database";
import { Comosdb } from "./";

export function getDiscoveryDbProvider(database: DiscoveryDbProvider) {
    if (database === 'COSMOSDB') {
        return new Comosdb()
    }

    throw new Error(`Database '${database}' is not a recognised db provider`)
}