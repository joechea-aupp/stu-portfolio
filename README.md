# Student Portfolio Directory

A responsive student portfolio directory built with Next.js. Features instant filtering, mobile filter drawer, a multi-theme color system, student leaderboard, and onboarding flow. Backend is MySQL, all services run via Docker.

## Stack

- **Next.js 16** (App Router, standalone output)
- **TypeScript**
- **Tailwind CSS v4**
- **Prisma ORM**
- **MySQL 8.4**
- **Docker / Docker Compose**

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2+
- Node.js 20+ (only needed for local dev outside Docker)

---

## Getting Started (Docker — recommended)

This is the preferred workflow so everyone uses the same database.

```bash
# 1. Clone the repo
git clone https://github.com/joechea-aupp/stu-portfolio.git
cd stu-portfolio

# 2. Create your local env file
cp .env.example .env
# Edit .env and set secure passwords before continuing

# 3. Build and start all services
docker compose up --build
```

- App: http://localhost:3000
- MySQL: `localhost:3306` (use the credentials from your `.env`)

Changes to source files require a rebuild (`docker compose up --build`) because the app runs from a compiled standalone image.

### Stopping services

```bash
docker compose down          # stop containers, keep data volume
docker compose down -v       # stop containers AND erase the database volume
```

---

## Local Dev (without Docker)

Useful for fast iteration on the frontend. You still need the MySQL container running for any database work.

```bash
# Start only the database
docker compose up db -d

# Install dependencies and run the dev server
npm install
npm run dev
```

Open http://localhost:3000. Hot-reload is active in this mode.

---

## Environment Variables

Copy `.env.example` to `.env`. Never commit `.env`.

| Variable | Description |
|---|---|
| `MYSQL_ROOT_PASSWORD` | Root password for MySQL |
| `MYSQL_DATABASE` | Database name |
| `MYSQL_USER` | App database user |
| `MYSQL_PASSWORD` | App database user password |
| `DATABASE_URL` | Prisma/MySQL connection string used by local Node.js runtime |

Inside Docker, `DATABASE_URL` is assembled automatically in `docker-compose.yml`.
For local development outside Docker, set `DATABASE_URL` in `.env` (see `.env.example`).

---

## Prisma ORM

After your `.env` is configured and MySQL is running:

```bash
# Generate Prisma Client
npm run db:generate

# Create/apply migrations during development
npm run db:migrate

# Push schema without migrations (optional)
npm run db:push

# Open Prisma Studio
npm run db:studio
```

---

## Database Initialization

SQL files in `db/init/` are executed automatically when the MySQL container is first created (alphabetical order). Use this for schema and seed data:

```
db/init/
  01_schema.sql   ← CREATE TABLE statements
  02_seed.sql     ← INSERT seed data
```

To reset and re-run init scripts, remove the volume:

```bash
docker compose down -v
docker compose up db -d
```

---

## Project Structure

```
src/
  app/                      # Next.js App Router pages
    page.tsx                # Directory home
    leaderboard/page.tsx
    onboard/page.tsx
    students/[id]/page.tsx
  components/
    cards/                  # StudentCard, StudentGrid, SubmitPortfolioCard, PortfolioStats
    directory/              # DirectoryApp (state + wiring)
    filters/                # FilterPanel, FilterSidebar, MobileFilterDrawer
    hero/                   # DirectoryHero
    layout/                 # TopNav, Footer
    leaderboard/            # LeaderboardApp
    onboard/                # OnboardModal
    search/                 # DirectorySearch
    theme/                  # ThemeSwitcher
  data/
    students.ts             # Mock data (replace with DB queries)
  types/
    student.ts              # Shared TypeScript types
db/
  init/                     # SQL init scripts for MySQL
```

---

## Theme Customization

Theme colors are CSS custom properties in [src/app/globals.css](src/app/globals.css).

1. Edit tokens under `[data-theme="classic"]`, `[data-theme="slate"]`, or `[data-theme="sunrise"]`.
2. Use `var(--color-...)` tokens in components — never hard-code colors.
3. Add a new theme: create a `[data-theme="your-name"]` block, then register the name in `src/types/student.ts` and `src/components/theme/ThemeSwitcher.tsx`.

Student card achievement tiers (bronze / silver / gold) use animated gradient borders defined in `globals.css`.

---

## Quality Checks

Run these before opening a PR:

```bash
npm run lint
npm run build
```
