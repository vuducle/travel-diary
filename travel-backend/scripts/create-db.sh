#!/usr/bin/env sh
set -e

# Create Postgres DB if it doesn't exist. Uses DB_* env vars or defaults.
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-password}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-travel_db}

export PGPASSWORD="$DB_PASSWORD"

# Check if psql/createdb exists
if command -v psql >/dev/null 2>&1; then
  if psql -h "$DB_HOST" -U "$DB_USER" -p "$DB_PORT" -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "Database '$DB_NAME' already exists"
  else
    echo "Creating database '$DB_NAME'..."
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
    echo "Database '$DB_NAME' created"
  fi
else
  echo "psql not found. Please install PostgreSQL client tools or create the database manually."
  exit 1
fi
