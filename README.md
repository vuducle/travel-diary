# Travel Diary – Backend

Backend for the Travel Diary application (NestJS + Prisma + PostgreSQL). The frontend is currently WIP; this README focuses on the backend only.

## Tech stack

- NestJS (REST + GraphQL)
- Prisma (PostgreSQL)
- JWT authentication
- Multer for uploads, Sharp for image optimization
- Swagger UI at /api

## Requirements

- Node.js 18+
- PostgreSQL 13+

## Environment

The app constructs `DATABASE_URL` from the following env vars (set in `.env`):

```
PORT=3000
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=travel_db
# Optional: relax CSP for GraphQL Playground in dev
RELAX_GRAPHQL_CSP=true
```

## Setup & run

```bash
cd travel-backend
yarn install

# create DB (optional helper)
yarn run db:create

# prisma
yarn run prisma:generate
yarn prisma migrate dev
# or push + seed
yarn run prisma:push
yarn run db:seed

# start dev
yarn run start:dev
```

Swagger docs: http://localhost:3000/api

Uploads are served from: http://localhost:3000/uploads/

## Uploads & file storage

Uploaded files are stored under `uploads/`. Preset multer configs live in `src/common/helpers/multer.helper.ts`:

- `avatarUploadConfig` -> `./uploads/avatars`
- `profileCoverUploadConfig` -> `./uploads/covers`
- `tripCoverUploadConfig` -> `./uploads/trips`
- `entryImageUploadConfig` -> `./uploads/entries`
- `locationCoverImageUploadConfig` -> `./uploads/locations`
- `profileUploadsMulterConfig()` -> handles both `avatar` and `coverImage` in one request

Optimization (resize + convert to webp) is done in `src/common/helpers/image.helper.ts`. If `sharp` is not installed, the original file is kept.

Accepted types and limits vary per config, typically: jpg, jpeg, png, webp; 5–10MB per file.

## Auth

Most endpoints are protected with JWT Bearer auth (scheme name `jwt` in Swagger). Obtain a token from the auth flow and include `Authorization: Bearer <token>` in requests.

## Key endpoints (REST)

### Users

- `GET /users/profile` — current profile
- `PATCH /users/profile` — update profile fields and optionally upload both `avatar` and `coverImage` in a single request (multipart/form-data)

Example (update with both files):

```bash
curl -X PATCH "http://localhost:3000/users/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=Julia Nguyen" \
  -F "bio=Travel enthusiast" \
  -F "location=Nam Dinh, Viet Nam" \
  -F "avatar=@/path/to/avatar.jpg" \
  -F "coverImage=@/path/to/cover.png"
```

- `GET /users/search?username=<q>` — search users by username (partial, case-insensitive)

### Locations

- `POST /locations` — create a location (multipart). Optional `coverImage`.

```bash
curl -X POST "http://localhost:3000/locations" \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=Ho Chi Minh City" \
  -F "tripId=your-trip-id" \
  -F "coverImage=@/path/to/cover.jpg"
```

- `PATCH /locations/:id` — update fields; optional `coverImage` in the same multipart request.

```bash
curl -X PATCH "http://localhost:3000/locations/<id>" \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=Saigon Updated" \
  -F "coverImage=@/path/to/new-cover.png"
```

- `PATCH /locations/:id/cover` — replace only the cover image.

```bash
curl -X PATCH "http://localhost:3000/locations/<id>/cover" \
  -H "Authorization: Bearer $TOKEN" \
  -F "coverImage=@/path/to/new-cover.png"
```

- `GET /locations?tripId=<tripId>&parentId=<optional>&page=1&limit=20` — list by trip
- `GET /locations/:id` — get one
- `DELETE /locations/:id` — delete (only if no children and no entries)

## GraphQL

GraphQL is available at `/graphql` with the standard NestJS Apollo setup. CSP is relaxed for the playground in dev (see `RELAX_GRAPHQL_CSP`).

## Testing

```bash
cd travel-backend
yarn test          # unit tests
yarn run test:e2e  # e2e tests
```

## Notes & next steps

- Frontend is WIP and not covered here yet.
- If you prefer cloud storage (S3/GCS/Azure Blob) instead of local uploads, we can add adapters.
- If you need stricter per-field limits, we can split configs or add field-aware filters.
