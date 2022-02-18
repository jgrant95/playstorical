export const validatePlaylist = (req: { playlistId, snapshotId?}, resp: { playlist }) => {
    // TODO: Improve playlist validation - make more generic between providers etc.
    try {
        if (resp.playlist === null) {
            throw new Error(`Playlist ${req.playlistId} was not found.`)
        }

        if (resp.playlist.id !== req.playlistId) {
            const msg = `Incorrect playlist returned from music provider. PlaylistId: ${req.playlistId}.`
            console.log(msg, resp.playlist)

            throw new Error(msg)
        }

        if (req.snapshotId && resp.playlist.snapshot_id !== req.snapshotId) {
            const msg = `Playlist was found and captured, but the snapshot did not match. PlaylistId: ${req.playlistId}. SnapshotId: ${req.snapshotId}`
            console.warn(msg, resp.playlist)
        }
    } catch (e) {
        console.log('Playlist validation failed.')

        throw e
    }
}