// Load environment variables from .env into process.env
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Support either a full DATABASE_URL or component environment variables
const dbUser = process.env.DB_USER ?? process.env.DATABASE_USER ?? 'postgres';
const dbPassword =
  process.env.DB_PASSWORD ?? process.env.DATABASE_PASSWORD ?? 'password';
const dbHost = process.env.DB_HOST ?? 'localhost';
const dbPort = process.env.DB_PORT ?? '5432';
const dbName = process.env.DB_NAME ?? 'travel_db';

const databaseUrl = `postgresql://${dbUser}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}?schema=public`;

// Set DATABASE_URL for schema to reference
process.env.DATABASE_URL = databaseUrl;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  engine: 'classic',
  datasource: {
    url: databaseUrl,
  },
});
