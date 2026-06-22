## Initial Data

- Data is always initialised from the given initial data, `data/users.json` is only written to.
- Invalid entries are discarded for simplicity.
- Phone numbers are parsed as US numbers and normalized to E.164.
- Possible but not necessarily valid/allocated phone numbers are accepted to avoid discarding too much of the provided data.
- This also affects the DTOs; In production, I would only accept valid, normalized phone numbers including country code.

## Data Persistence

- The users repository keeps an in-memory `id -> user` object as the source of truth, allowing average `O(1)` lookups by id.
- Changes are persisted asynchronously with concurrency `1`.

### Upsides

- Writes are coalesced, so there is no unbounded persistence queue.
- There are no lock waits or synchronous filesystem operations on the request path, keeping request latency low.

### Drawbacks

- The in-memory source of truth makes multi-process or horizontally scaled deployments unsafe without additional coordination.
- Recently accepted writes can be lost if the process exits before asynchronous persistence completes.
