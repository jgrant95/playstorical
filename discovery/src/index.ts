import express from "express";

import { Creator } from "creator";

const port = 4200
var app = express();

// creator is not persisting or does not have the private this.props available :()
const creator = new Creator({ database: 'COSMOSDB' })

const startCreatorProcess = async () => {
    console.log('Starting...')

    await creator.start('BY_CATEGORY')

    console.log('DONE')
}

const poll = async () => {
    await startCreatorProcess()

    console.log('Waiting 1min til next execution...')
    setTimeout(poll, 60000)
}

poll()