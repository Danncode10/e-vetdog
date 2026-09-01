#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ -f .env.local ]; then
  set -a
  source .env.local
  set +a
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Error: DATABASE_URL is not set in .env.local."
  exit 1
fi

echo "============================================================"
echo " Starting Schema Drift Verification"
echo "============================================================"

# If docker is not available, we need a remote test database
USE_DOCKER=true
if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
  USE_DOCKER=false
  echo "Docker is not running or not installed."
  if [ -z "${TEST_DATABASE_URL:-}" ]; then
    echo "------------------------------------------------------------"
    echo "⚠️  Cannot run local test database."
    echo "To test your schema synchronization without Docker, you can use a temporary cloud database (e.g. a blank Supabase project)."
    echo ""
    echo "Option 1: Start Docker and run this script again."
    echo "Option 2: Create a temporary Supabase project, get its database URL, and run:"
    echo "          TEST_DATABASE_URL=\"postgres://...\" pnpm db:test-sync"
    echo "------------------------------------------------------------"
    exit 1
  else
    echo ">> Using provided TEST_DATABASE_URL for the fresh database..."
  fi
fi

# We need a way to dump the schema. If we don't have docker, we need Supabase CLI or pg_dump
if [ "$USE_DOCKER" = "false" ] && ! command -v npx >/dev/null 2>&1; then
  echo "Error: npx is required to use Supabase CLI for dumping schemas."
  exit 1
fi

echo ">> Dumping schema from LIVE database..."
if [ "$USE_DOCKER" = "true" ]; then
  docker run --rm postgres:17 pg_dump --schema-only --schema=public --no-owner --no-privileges "$DATABASE_URL" > live_schema.sql
else
  npx supabase db dump --db-url "$DATABASE_URL" -f live_schema.sql
fi
grep -v '^--' live_schema.sql | grep -v '^$' > live_schema_clean.sql

if [ "$USE_DOCKER" = "true" ]; then
  echo ">> Starting local Supabase instance..."
  if [ -d "supabase/migrations" ]; then
    mv supabase/migrations supabase/migrations_backup
  fi
  npx supabase start || {
    # If it fails, make sure we restore the folder before exiting
    if [ -d "supabase/migrations_backup" ]; then
      mv supabase/migrations_backup supabase/migrations
    fi
    exit 1
  }
  if [ -d "supabase/migrations_backup" ]; then
    mv supabase/migrations_backup supabase/migrations
  fi
  echo ">> Applying local codebase migrations..."
  LOCAL_DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
  DATABASE_URL="$LOCAL_DB_URL" npx tsx db/migrate.ts
  echo ">> Dumping schema from LOCAL database..."
  docker run --rm postgres:17 pg_dump --schema-only --schema=public --no-owner --no-privileges "postgresql://postgres:postgres@host.docker.internal:54322/postgres" > local_schema.sql
  npx supabase stop
else
  echo ">> Applying local codebase migrations to TEST_DATABASE_URL..."
  DATABASE_URL="$TEST_DATABASE_URL" npx tsx db/migrate.ts
  echo ">> Dumping schema from TEST database..."
  npx supabase db dump --db-url "$TEST_DATABASE_URL" -f local_schema.sql
fi

grep -v '^--' local_schema.sql | grep -v '^$' > local_schema_clean.sql

echo "============================================================"
echo " Comparing Schemas"
echo "============================================================"
diff -u live_schema_clean.sql local_schema_clean.sql > schema_diff.txt || true

if [ -s schema_diff.txt ]; then
  echo "⚠️  SCHEMA DRIFT DETECTED!"
  echo "Your live database has differences compared to what is produced by your local db/migrations/ files."
  echo "Please check 'schema_diff.txt' to see the exact differences."
else
  echo "✅ NO SCHEMA DRIFT DETECTED!"
  echo "You are 100% synchronized."
  rm schema_diff.txt
fi

rm live_schema.sql live_schema_clean.sql local_schema.sql local_schema_clean.sql
echo "Done."
