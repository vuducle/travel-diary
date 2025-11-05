## Travel Diary API (NestJS + Prisma + Redis)

Backend for a travel diary app with trips, locations, entries (multi-image), likes/comments, real-time chat, notifications, Swagger docs, and GraphQL.

Highlights:

- JWT authentication with logout token blacklist in Redis
- Trips, Locations (parent/child), Entries with multiple images (Sharp optimization)
- Likes and comments on trips
- Socket.IO chat gateway (token from Authorization header or handshake auth)
- Swagger/OpenAPI at /api; GraphQL Playground at /graphql (development only)
- Static uploads served from /uploads

The root path `/` serves a small HTML landing page with a link to `/api`.

## Prerequisites

- Node.js 20+ and Yarn
- PostgreSQL 13+ (local or remote)
- Redis 6+ (for JWT blacklist and real-time features)

On macOS (zsh), you can install services with Homebrew:

```zsh
brew install postgresql@14 redis
brew services start postgresql@14
brew services start redis
```

## Environment variables

You can use a single `DATABASE_URL` or provide component variables; the app will construct `DATABASE_URL` from the component values when absent.

- PORT: Port to run the API (default 3000)
- DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME: Components for `DATABASE_URL` (defaults: postgres/password/localhost/5432/travel_db)
- DATABASE_URL: Postgres connection string (overrides components), e.g. `postgresql://user:pass@localhost:5432/travel_db?schema=public`
- JWT_SECRET: Secret for signing JWTs (default: change_this_secret)
- JWT_EXPIRES_IN: Token TTL; number of seconds or timespan string like `"1h"`, `"7d"` (default: 3600)
- REDIS_URL: Redis connection string (default: redis://localhost:6379)
- RELAX_GRAPHQL_CSP: Set `true` to relax Helmet CSP on `/graphql` even when `NODE_ENV=production` locally

Example `.env`:

```env
PORT=3000
# Compose DATABASE_URL from components if omitted
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=travel_db

# Or provide DATABASE_URL directly
# DATABASE_URL=postgresql://postgres:password@localhost:5432/travel_db?schema=public

JWT_SECRET=supersecret_dev_only
JWT_EXPIRES_IN=1h
REDIS_URL=redis://localhost:6379
```

## Install and setup

```zsh
yarn install
# Optional: create DB via psql and seed schema
yarn db:setup
```

What `db:setup` does:

- Creates the Postgres database if it doesn’t exist (requires psql)
- Generates the Prisma client
- Pushes the schema to the database
- Runs the seed script (if present)

If you prefer manual Prisma steps:

```zsh
yarn prisma:generate
yarn prisma:push
```

## Run the API

```zsh
# Development (watch)
yarn start:dev

# Production build
yarn build
yarn start:prod
```

Once running:

- Swagger docs: http://localhost:3000/api (authorize with Bearer JWT using the `jwt` scheme)
- GraphQL (dev only): http://localhost:3000/graphql
- Uploads: http://localhost:3000/uploads/

## Authentication

REST endpoints:

- POST `/auth/register` — register a new user
- POST `/auth/login` — returns `{ access_token }`
- POST `/auth/logout` — invalidate current token (blacklisted in Redis); send `Authorization: Bearer <token>`

JWT details:

- Secrets and expiry configured via `JWT_SECRET` and `JWT_EXPIRES_IN`
- `JWT_EXPIRES_IN` accepts numeric seconds or strings like `1h`, `7d`

## Core resources

- Trips: CRUD with optional cover image; visibility (PRIVATE/FRIENDS/PUBLIC)
- Locations: child hierarchy per trip; ownership validation
- Entries: multiple images (`images[]` on create, `addImages[]` on update); reorder/remove; safe file cleanup
- Likes/Comments: for trips

Media:

- Uploads are saved under `uploads/` and served at `/uploads/`
- Images are optimized to WebP via Sharp (falls back gracefully if unavailable)

## Real-time chat

- Socket.IO gateway at the default namespace
- Authenticate by providing the JWT via either:
  - `handshake.auth.token = '<JWT>'`, or
  - `Authorization: Bearer <JWT>` header
- On connect, the gateway validates the token and marks the user online

## Testing

```zsh
# Unit tests with coverage
yarn test:cov

# E2E tests
yarn test:e2e
```

Note: E2E tests expect a reachable database. Ensure Postgres is running and env vars are set.

## Linting and formatting

```zsh
yarn lint
yarn format
```

## Troubleshooting

- JWT error: `expiresIn should be a number of seconds or string representing a timespan`
  - Ensure `JWT_EXPIRES_IN` is either a number (seconds) or a string like `1h`, `7d`.
- Redis connection errors
  - Verify `REDIS_URL` and that Redis is running locally: `redis-cli PING` => `PONG`.
- Prisma database connection
  - Either set `DATABASE_URL` or the `DB_*` component vars; confirm the DB exists (`yarn db:create`).
- GraphQL Playground blocked by CSP
  - In development CSP is disabled. If you set `NODE_ENV=production` locally and still want Playground, set `RELAX_GRAPHQL_CSP=true`.

---

Happy traveling and building!
