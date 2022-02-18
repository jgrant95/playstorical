import { MusicProviderType } from "../../models"
import { Spotify } from "."

const redirectUri = 'http://localhost:4200/callback'
const clientId = '8087412e6ce64950b2d699062cd80e83'
const clientSecret = '5e1ea8df6f2c403c90ff91c981e297e2'

export function getMusicProvider(database: MusicProviderType) {
    if (database === 'spotify') {
        return new Spotify({
            clientId,
            clientSecret,
            redirectUri
        })
    }

    throw new Error(`Database '${database}' is not a recognised db provider`)
}