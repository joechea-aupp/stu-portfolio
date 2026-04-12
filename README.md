# Student Portfolio Directory

A student portfolio directory built with Next.js, Prisma, and MySQL. The app includes a searchable student directory, leaderboard, onboarding flow, login/create-account pages, and role-aware administration foundations.

This README is written for contributors first: how to get the app running, where the main code lives, and what to do before opening a PR.

## Stack

- Next.js 16 with the App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Prisma 7 with MariaDB adapter
- MySQL 8.4
- Docker Compose for local development

## Prerequisites

- Docker with Compose v2+
- Node.js 20+ and npm if you want to run the app outside Docker

## Quick Start

### Recommended workflow: Docker Compose

This is the easiest path for a new contributor because the app and database start with the same settings every time.

```bash
git clone https://github.com/joechea-aupp/stu-portfolio.git
cd stu-portfolio
cp .env.example .env

# Start the app and database
docker compose up --build
```

In a second terminal, apply the existing Prisma migrations and seed demo data:

```bash
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run db:seed
```

Open http://localhost:3000.

What to expect:

- App: http://localhost:3000
- MySQL: localhost:3306
- Source changes hot-reload in Docker because the repository is bind-mounted into the app container

When you need to stop or reset the stack:

```bash
docker compose down
docker compose down -v
```

Use `down -v` only when you want to delete the MySQL data volume and start fresh.

### Alternative workflow: App on host, DB in Docker

This is useful if you prefer running Next.js directly on your machine while keeping MySQL containerized.

```bash
cp .env.example .env
docker compose up db -d
npm install
npm run db:generate
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open http://localhost:3000.

## Environment Variables

Copy `.env.example` to `.env`. Do not commit `.env`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `MYSQL_ROOT_PASSWORD` | Yes | MySQL root password |
| `MYSQL_DATABASE` | Yes | Database name |
| `MYSQL_USER` | Yes | App database user |
| `MYSQL_PASSWORD` | Yes | App database user password |
| `DATABASE_URL` | Yes for host-run app | Prisma connection string used when Node.js runs on your machine |
| `NEXT_PUBLIC_APP_URL` | Yes | Base URL used for canonical/Open Graph links |
| `NEXT_PUBLIC_APP_NAME` | No | Overrides the default UI brand name (`EagleHUB`) |
| `SEED_USER_PASSWORD` | No | Overrides the default password used by the seed script |

Notes:

- In Docker, the app container builds its own `DATABASE_URL` from the Compose service settings.
- For host-machine Prisma access against MySQL 8, keep `?allowPublicKeyRetrieval=true` in `DATABASE_URL`.

## Common Commands

Host workflow:

```bash
npm run dev
npm run lint
npm run build
npm run db:generate
npm run db:migrate -- --name your_migration_name
npm run db:push
npm run db:seed
npm run db:studio
```

Docker workflow for one-off commands against the running app container:

```bash
docker compose exec app npm run lint
docker compose exec app npm run build
docker compose exec app npm run db:generate
docker compose exec app npm run db:migrate -- --name your_migration_name
docker compose exec app npm run db:push
docker compose exec app npm run db:seed
docker compose exec app npm run db:studio
```

Guidance:

- Use `db:migrate` when you changed `prisma/schema.prisma` and want a real migration checked into source control.
- Use `db:push` only for disposable local schema syncing when you do not want a migration file.
- `prisma migrate dev` is interactive, so run it from a normal terminal session.

## Fresh Database Setup

The `db/init/` directory is only used for MySQL container bootstrapping tasks such as granting privileges for Prisma's shadow database. It does not replace Prisma migrations.

For a clean local database:

```bash
docker compose down -v
docker compose up -d db app
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run db:seed
```

## Seed Data

The seed script reads from `src/data/students.ts` and creates:

- one `users` record per mock student
- one linked `Student` record per seeded user
- the predefined majors used by the app

Seeded login details:

- Email format: `<student-id>@seed.local`
- Password: `ChangeMe123!` by default
- Override password with `SEED_USER_PASSWORD`

## Project Map

Use this as a starting point when deciding where to make changes.

```text
src/
  app/                Next.js routes, layouts, and API handlers
  components/         Reusable UI grouped by feature
  data/               Mock/demo student data used by the seed flow
  lib/                Prisma client, auth/session helpers, app config, RBAC helpers
  types/              Shared TypeScript types
prisma/
  schema.prisma       Database schema
  migrations/         Checked-in migration history
  seed.ts             Seed script
db/
  init/               MySQL container init hooks
public/
  images/             Static images
  uploads/avatars/    Uploaded avatar assets
```

If you are new to the codebase, these are the usual entry points:

- Directory UI: `src/app/page.tsx` and `src/components/directory/`
- Login and account creation: `src/app/login/` and `src/app/create-account/`
- Leaderboard: `src/app/leaderboard/` and `src/components/leaderboard/`
- Student data model: `prisma/schema.prisma`, `src/lib/prisma.ts`, and `src/types/student.ts`

## UI and Theme Notes

Theme tokens live in `src/app/globals.css`.

- Update CSS custom properties inside the existing theme blocks
- Prefer shared theme tokens over hard-coded colors in components
- Register any new theme consistently in both the styling and UI selector logic

## Contributing Checklist

Before opening a PR:

1. Pull the latest changes from the working branch.
2. Apply migrations or create a new migration if you changed the Prisma schema.
3. Reseed locally if your change depends on demo data.
4. Run `npm run lint`.
5. Run `npm run build`.
6. Update the README or other docs if you changed setup, scripts, or contributor workflow.

## Troubleshooting

- App starts but data is missing: run the migrations, then run the seed script.
- Prisma cannot connect from the host: verify `.env` has the correct `DATABASE_URL` and includes `allowPublicKeyRetrieval=true`.
- Docker app is running but dependency changes are not reflected: run `docker compose exec app npm ci`, or recreate the app container and its `app-node-modules` volume.
