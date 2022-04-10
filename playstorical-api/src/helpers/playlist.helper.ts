export const validatePlaylist = (req: { playlistId }, resp: { playlist }) => {
    // TODO: Improve playlist validation - make more generic between providers etc.
    try {
        if (resp.playlist === null) {
            throw new Error(`Playlist ${req.playlistId} was not found.`)
        }

        if (!resp.playlist.snapshot_id) {
            throw new Error(`Playlist from spotify must have a 'snapshot_id'. Requested: PlaylistId: ${req.playlistId}.`)
        }

        if (resp.playlist.id !== req.playlistId) {
            const msg = `Incorrect playlist returned from music provider. PlaylistId: ${req.playlistId}.`
            console.log(msg, resp.playlist)

            throw new Error(msg)
        }
    } catch (e) {
        console.log('Playlist validation failed.')

        throw e
    }
}