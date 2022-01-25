import express from "express";
import { SpotifyDiscoverer } from "spotify";

const port = 4200
var app = express();

const redirectUri = 'http://localhost:4200/callback'
const clientId = '8087412e6ce64950b2d699062cd80e83'
const clientSecret = '5e1ea8df6f2c403c90ff91c981e297e2'

const getSPotifyStuff = async () => {
    console.log('Starting...')
    const spotify = new SpotifyDiscoverer(
        {
            clientId,
            clientSecret,
            redirectUri
        })

    await spotify.authenticate()

    const cats = await spotify.getCategoryIds()

    console.log(cats.length, cats)

    const allPlaylistReq = cats.map(id => spotify.getPlaylistIds(id));

    const playlistIds = (await Promise.all(allPlaylistReq)).flat()

    console.log(playlistIds.length, '...playlists. Finished.')
}

getSPotifyStuff()