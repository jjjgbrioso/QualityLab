# Environments and deployment

STAGING is live at https://quality-lab-jb.vercel.app. The earlier address, https://quality-lab-teal.vercel.app, permanently redirects there (308), keeping the path and query, so old links and API calls still work. Both addresses are set in the Vercel project under **Settings > Domains**.

## Environments

| | LOCAL | STAGING |
| --- | --- | --- |
| Application | `npm run dev` on your PC | Vercel project `quality-lab` |
| Database | Local server from `npm run db:start` | Neon PostgreSQL, AWS US East (N. Virginia) |
| Settings | `web-app/.env.local` | Vercel environment variables |
| `APP_ENV` | `local` | `staging` |

QualityLab's STAGING runs in Vercel's **Production** environment, so the variables are set on Production and `APP_ENV` tells the two apart.

Environment files are git-ignored. Only the `.example` templates are committed, and they hold placeholders.

## Environment variables

| Variable | Needed for | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Running app | On hosted databases, use the pooled connection string |
| `DIRECT_DATABASE_URL` | Migrations from your PC | Direct, non-pooled connection string. Not needed on Vercel |
| `JWT_SECRET` | Running app | At least 32 random characters. Use a different value for each environment |
| `JWT_EXPIRES_IN_SECONDS` | Optional | Defaults to 7200 |
| `DUPLICATE_WINDOW_SECONDS` | Optional | Defaults to 30. Use 0 to turn the check off |
| `APP_ENV` | Optional | Shown by the health check |
| `TEST_DATABASE_URL` | Integration tests only | Never point this at a database you care about |

## Deploying an update

The Vercel project is linked to GitHub, so every push to `main` deploys to STAGING. After a push, confirm the site as an anonymous visitor:

1. `/api/v1/health` returns 200, with `environment` set to `staging` and database status `up`.
2. In a browser, `/shop` redirects to the login page, and lists products after you sign in. Command-line tools such as `curl` get HTTP 200 with the redirect in the page instead. See the [automation guide](automation-guide.md#behaviour-to-plan-for).

Check the health endpoint rather than the build status. A build can succeed, and static pages can load, while the database connection is broken.

## Migrations and seed data

Your connection strings go in `web-app/.env.staging.local`, which is git-ignored. Create it from the template, then fill in your real values:

```powershell
Copy-Item .env.staging.example .env.staging.local
```

Run these in PowerShell from `web-app`.

To apply new migrations, run this before pushing code that depends on them:

```powershell
$env:QL_ENV = "staging"
npm run db:deploy
Remove-Item Env:QL_ENV
```

To load the baseline data into an empty database:

```powershell
$env:QL_ENV = "staging"
npm run db:seed
Remove-Item Env:QL_ENV
```

`db:seed` refuses a database that already has data. The banking update, which moved Banking to pesos and added account opening, needs only `db:deploy`: its migration converts existing accounts itself. When the baseline itself changes, as it did when cruises and sale prices were added, apply the migrations and then [reset STAGING](#resetting-staging) to load the new baseline. A reset deletes everything on that database, including anything visitors created.

## Setting up a new environment

These are the steps used to create STAGING.

1. **Create the database.** Create a hosted PostgreSQL 18 project in the region closest to your Vercel functions. Vercel uses Washington, D.C. (`iad1`) by default, which pairs with AWS US East (N. Virginia). Copy its pooled and direct connection strings. Keep them out of the repository and out of chat.
2. **Load the schema and data.** Follow [Migrations and seed data](#migrations-and-seed-data).
3. **Import the repository.** On the Vercel **New Project** page, choose **GitHub** and import `QualityLab`.
4. **Set the Root Directory to `web-app`.** Confirm that the framework shows **Next.js**. `web-app/vercel.json` sets this, but a project left on **Other** can return 404 for every page while Vercel reports it as Ready.
5. **Add the environment variables on Production:** `DATABASE_URL`, `JWT_SECRET`, and `APP_ENV` set to `staging`. Paste each value on its own, with no variable name, quotes, or spaces.
6. **Deploy,** then run the checks in [Deploying an update](#deploying-an-update).

To deploy with the CLI instead, run `vercel deploy --prod` from the repository root, not from `web-app`, because the project's Root Directory is already `web-app`.

`vercel link` can add `.env*` to a `.gitignore` file and write a short-lived token to `.env.local`. If you run it, check that the templates are still tracked afterwards:

```powershell
git ls-files | Select-String "env"
```

You should see `web-app/.env.example` and `web-app/.env.staging.example`.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Database error says `Can't reach database server at base` | `DATABASE_URL` is not a clean `postgresql://` string. It is empty, or has extra text such as the variable name or quotes | Re-enter the value, then redeploy |
| Health returns 503 with `JWT_SECRET is missing or too short` | The variable is missing or under 32 characters | Set it, then redeploy |
| Every page returns 404 but the deployment says Ready | The framework preset is **Other** | Set it to Next.js and redeploy |
| Logs show a Node.js version other than 24 | `engines.node` in `web-app/package.json` overrides the dashboard setting | Keep it set to `24.x` |
| Deployment is blocked on a private repository | On Vercel Hobby, the commit author must be the account owner | Connect the GitHub account under **Login Connections** |
| Logs show an SSL `SECURITY WARNING` from `pg` | An upcoming change in the database driver. Today's behaviour is the stricter one | No action needed. It is logged at error level, but it is not a failure |

Variables changed in Vercel apply only to new deployments.

## Resetting STAGING

This deletes all data on that database, so the command needs a one-time confirmation variable:

```powershell
$env:QL_ENV = "staging"
$env:QL_ALLOW_REMOTE_RESET = "yes"
npm run db:reset
Remove-Item Env:QL_ALLOW_REMOTE_RESET
Remove-Item Env:QL_ENV
```

## Known limits of the public demo

- The test accounts and their passwords are published in the project documentation by design, including the admin account. They are no longer shown on the login page. Anyone who has them can change the demo data until the next reset. All data is fictional, but expect it to drift.
- The application has no rate limiting, so it accepts unlimited login attempts and registrations.
- The database sleeps after 5 minutes without traffic on Neon's Free plan, so the first request after a pause is slower. Allow for this in timing checks.
- The Free plan allows 100 compute hours a month per project and 5 GB of network transfer. Past either limit, the database stops until the next billing period, so plan load tests with this in mind.
- Keep the database separate from anything else. It should hold only this demo data.
