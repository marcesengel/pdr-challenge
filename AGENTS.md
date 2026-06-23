You're working in an `nx` monorepo using `pnpm` as its package manager.

Use the `pnpm` version pinned by `packageManager` in `package.json` via Corepack.

For repo-wide Nx tasks, do not inspect project files first. Use these commands directly:

- Lint all projects: `corepack pnpm exec nx run-many -t lint --all`
- Build all projects: `corepack pnpm exec nx run-many -t build --all`
- Build a single project: `corepack pnpm exec nx build [project]`

Available Nx targets: `build`, `lint`. Always ask for network access/sandbox escalation when running nx or pnpm commands.

## `/apps/api`

NestJS backend, storing users in-memory with async persistence to JSON.

## `/apps/frontend`

Angular Material frontend with SCSS.

## `/libs/shared`

DTO definitions.
