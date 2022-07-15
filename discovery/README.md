# Discovery.creator
  - Service
  - Creates discovery records of playlists from spotify api.
  - Receives `Start discovery` event, and will emit multiple other different `Start process 'X'` events.
  - Receives `Playlists discovered` events, which will 
  - Multiple varying processes interacting with spotify api in different ways. This should result in diverse and larger set of playlist results.
  - UI which allows manual triggering of processes, discover individual playlist, view simple db queries, stats & metrics.

# Discovery.processor
  - Serverless-functions
  - Tied to a specific process of retrieving spotify playlists - may not work due to spotify api limits with rates??
  - Allows for horizontal/dynamic scaling and distrubutes processes out between `Discovery.processor` nodes/functions available
  - Emits `Processor completed` event or Upserts to db?

# Discovery.loader
  - Service / Serverless-function
  - Loads discovery playlist records and emits events to be read by external services for change detection
  - Executed on regular basis (via. cron job / schedule)

---
## TODOs
- [ ] Full retry on bulk inserts, ensuring we don't enter infinite loop on failing items
- [ ] Refactor the current state of files / classes. Both spotify and cosmosdb-container need somethinking.
  - [ ] Put spotify behind provider pattern, cleans up code and make it more exdentable in the future

## Discover new playlists

- Schedule when to begin discovery
  - Authenticate
  - Get playlists
    - Get all genres, and then get all playlists based on all genres
    - Emit event per playlist id, or batched ids
  - Read each event, and follow changes flow.