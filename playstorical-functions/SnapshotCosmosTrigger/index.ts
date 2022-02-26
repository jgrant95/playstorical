import { AzureFunction, Context } from "@azure/functions"

import { Snapshot } from '@playstorical/core/models'

const cosmosDBTrigger: AzureFunction = async function (context: Context, documents: Snapshot[]): Promise<void> {
    if (!!documents && documents.length > 0) {
        const doc = documents[0]
        context.log('Document Id: ', doc.id);
    }
}

export default cosmosDBTrigger;
