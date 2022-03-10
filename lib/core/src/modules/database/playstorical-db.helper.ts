import { Cosmosdb } from "../../modules"
import { PlaystoricalDbProvider } from "../../models"

export function getPlaystoricalDbProvider(database: PlaystoricalDbProvider) {
    if (database === 'cosmosdb') {
        return new Cosmosdb()
    }

    throw new Error(`Database '${database}' is not a recognised db provider`)
}