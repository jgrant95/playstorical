import { AzureFunction, Context } from "@azure/functions"

import { Snapshot } from '@playstorical/core/models'

const cosmosDBTrigger: AzureFunction = async function (context: Context, documents: Snapshot[]): Promise<Snapshot> {
    if (!!documents && documents.length > 0) {
        const doc = documents[0]
        context.log('Document Id: ', doc.id);

        // GET ADDITIONAL TRACKS

        return Promise.resolve({
            ...doc,
            test: 'MR LOL'
        } as any)
    }
}

export default cosmosDBTrigger;
