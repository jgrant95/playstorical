import { Creator } from "./creator";

// creator is not persisting or does not have the private this.props available :()
const creator = new Creator({ database: 'cosmosdb' })

const startCreatorProcess = async () => {
    console.log('Starting...')

    await creator.start('BY_CATEGORY')

    console.log('DONE')
}

const poll = async () => {
    try {
        await startCreatorProcess()
    }
    catch (e) {
        console.log('Creator process failed.', e)
    }

    console.log('Waiting 1min til next execution...')
    setTimeout(poll, 60000)
}

poll()
    .then(_ => {
        console.log('poll finished')
    })
    .catch(e => {
        console.log('big ol err', e)
    })