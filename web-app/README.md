# QualityLab web application

The Next.js application, REST API, database schema, seed data, and tests for QualityLab.

## Requirements

- Node.js 24
- npm
- PostgreSQL, which `npm run db:start` provides for local use with no system install

## Install and run locally

Run these in PowerShell from the `web-app` folder.

1. Install dependencies. This also generates the Prisma client.

   ```powershell
   npm install
   ```

2. Create your local environment file. It is git-ignored.

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Generate a secret and paste it into `JWT_SECRET` in `.env.local`.

   ```powershell
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```

4. Start the local PostgreSQL server in its own terminal and leave it running.

   ```powershell
   npm run db:start
   ```

5. In a second terminal, create the tables and load the baseline data.

   ```powershell
   npm run db:deploy
   npm run db:seed
   ```

6. Start the application.

   ```powershell
   npm run dev
   ```

Open http://localhost:3000. To confirm it works, open http://localhost:3000/api/v1/health.

### Using your own PostgreSQL

`npm run db:start` is optional. To use another server, point `DATABASE_URL` and `TEST_DATABASE_URL` in `.env.local` at it and skip step 4.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Generate the Prisma client and build for production |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript types |
| `npm test` | Run unit and integration tests |
| `npm run test:unit` | Run unit tests, which need no database |
| `npm run test:integration` | Run integration tests against `TEST_DATABASE_URL` |
| `npm run db:start` | Run the local PostgreSQL server |
| `npm run db:migrate` | Create and apply a migration during development |
| `npm run db:deploy` | Apply existing migrations |
| `npm run db:seed` | Load baseline data into an empty database |
| `npm run db:reset` | Delete all data and reload the baseline |
| `npm run db:studio` | Browse the data in Prisma Studio |

`db:reset` refuses a remote database unless `QL_ALLOW_REMOTE_RESET=yes` is set for that one command.

## Tests

Integration tests need the database server running, and they wipe the database named in `TEST_DATABASE_URL`. If `TEST_DATABASE_URL` is not set, they are skipped.

The test suite covers business rules. It is separate from the planned Selenium, Playwright, API, and JMeter projects, which will test this application from the outside.

## Source layout

```
prisma/               Schema and migrations
scripts/              Local database, seed, and reset scripts
src/app/              Pages
src/app/api/v1/       REST API route handlers
src/components/       Shared UI and forms
src/lib/services/     Business rules, shared by the API and the pages
src/lib/validation/   Zod schemas, also the source of the OpenAPI request bodies
src/lib/openapi.ts    OpenAPI document
tests/                Unit and integration tests
```

Money is stored as integer cents, so totals never depend on floating point.

## More documentation

See the [project README](../README.md) and the [documentation folder](../documentation).
