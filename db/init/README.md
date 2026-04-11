# SQL files dropped in this directory are executed automatically
# when the MySQL container is first started (docker-entrypoint-initdb.d).
#
# Example:
#   00_prisma_shadow_privileges.sh  — grants CREATE/DROP needed by Prisma Migrate shadow DB
#   01_schema.sql  — CREATE TABLE statements
#   02_seed.sql    — INSERT seed data
#
# Note: init scripts run only on first database initialization.
# If you add/change scripts later, recreate the volume:
#   docker compose down -v && docker compose up db -d
