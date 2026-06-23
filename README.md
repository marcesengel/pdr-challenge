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

## Frontend Theme

The Angular Material 3 theme palettes are generated with the Angular Material schematic:

```sh
nx generate @angular/material:theme-color \
  --primary-color '#1da4e8' \
  --secondary-color '#20d2a8' \
  --tertiary-color '#e4dc46' \
  --error-color '#d32f55' \
  --directory apps/frontend/src/ \
  --is-scss true \
  --include-high-contrast false
```

Leave the neutral and neutral variant prompts blank unless custom neutral palettes are required. The trailing slash in `apps/frontend/src/` is intentional; without it, the schematic writes `apps/frontend/src_theme-colors.scss` instead of `apps/frontend/src/_theme-colors.scss`.

> [!NOTE]
> The colors passed to the schematic are Material 3 seed colors. Angular Material generates tonal palettes from them, so the emitted theme role values such as `--mat-sys-primary` may not exactly match the original hex inputs.

## Git Hooks

Run `corepack pnpm install` after cloning so the `prepare` script configures Husky.

The pre-commit hook runs a quiet Prettier check, blocking commits until files match the repo Prettier configuration.
