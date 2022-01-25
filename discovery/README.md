# Discovery

This is a service that will:
- Discover new playlists from spotify
  - This will be only be vertically scalable due to the limiting factor of needing to poll as the primary process.
- Discover changes on existing playlists disovered
  - Incoming events with playlist ids will be read from a message bus, allowing for a horizontal scaling of this process.
  - These events will be created by the `Discovery.loader` service.

## Discover new playlists
---

- Schedule when to begin discovery
  - Authenticate
  - Get playlists
    - Get all genres, and then get all playlists based on all genres
    - Emit event per playlist id, or batched ids
  - Read each event, and follow changes flow.