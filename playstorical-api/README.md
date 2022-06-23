### Todos
---
- Introduce tests, initially for all helper funcs
- Add debugging mode, which ensures the queue will get executed syncronously + more verbose logs.

### Capture Steps
---
1) Authenticate with provider (Todo: should get cached after init)
2) Get playlist data (header data + tracks)
3) Validate, ensure we have good data from provider
4) Create playstorical records (Todo: Make this reliable)
    - Todo: Fix: Error: Cannot run batch request with more than 100 operations per partition
        - We need to ensure our batch ops that get put together never go over 100
        - Write tests around the helpers

