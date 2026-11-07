# Environments and deployment

The application has not been deployed yet. Use this guide when you are ready. Deployment needs a hosted PostgreSQL database, which is not set up.

## Environments

| | LOCAL | STAGING |
| --- | --- | --- |
| Application | `npm run dev` on your PC | Vercel |
| Database | Local server from `npm run db:start` | Separately hosted PostgreSQL |
| Settings | `web-app/.env.local` | Vercel environment variables |
| `APP_ENV` | `local` | `staging` |

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

## Deploy to Vercel

Run these in PowerShell from the `web-app` folder unless a step says otherwise.

### 1. Create the database

Create a PostgreSQL database with a hosted provider, such as the free tier of Neon, and copy its pooled and direct connection strings. The account and credentials are yours, so keep them out of the repository and out of chat.

### 2. Load the schema and baseline data

Copy the template to a git-ignored file, then fill in your real values.

```powershell
Copy-Item .env.staging.example .env.staging.local
```

Apply the migrations and load the baseline data.

```powershell
$env:QL_ENV = "staging"
npm run db:deploy
npm run db:seed
Remove-Item Env:QL_ENV
```

### 3. Link the project

```powershell
vercel link
```

Keep **Root Directory** set to `web-app`. `web-app/vercel.json` sets the framework to Next.js. This matters: a project left on the **Other** preset can return 404 for every page while Vercel still reports the deployment as Ready.

`vercel link` may add `.env*` to a `.gitignore` file. Afterwards, check that the templates are still tracked:

```powershell
git ls-files | Select-String "env"
```

You should see `web-app/.env.example` and `web-app/.env.staging.example`.

### 4. Set the environment variables

Each command prompts for the value, which keeps secrets out of your shell history.

```powershell
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add APP_ENV production
```

Enter `staging` for `APP_ENV`. Use a new random value for `JWT_SECRET`.

### 5. Deploy

```powershell
vercel deploy --prod
```

### 6. Verify as an anonymous visitor

Open these in a private window, with `<your-url>` replaced by your deployment URL:

1. `https://<your-url>/api/v1/health` returns 200, with `environment` set to `staging` and database status `up`.
2. `https://<your-url>/` loads the home page. A 404 here means the framework preset is wrong.
3. `https://<your-url>/api-docs` shows Swagger.
4. Log in as `alice@qualitylab.test`, and confirm the banking page shows $2,500.00 in checking.

## Resetting STAGING

This deletes all data on that database, so the command needs a one-time confirmation variable:

```powershell
$env:QL_ENV = "staging"
$env:QL_ALLOW_REMOTE_RESET = "yes"
npm run db:reset
Remove-Item Env:QL_ALLOW_REMOTE_RESET
Remove-Item Env:QL_ENV
```

## Things to know before going public

- The test accounts and their passwords are published on the login page by design, including the admin account. Anyone with the URL can change the demo data until the next reset. All data is fictional, but expect it to drift.
- The application has no rate limiting, so a public deployment accepts unlimited login attempts and registrations.
- Keep the database separate from anything else. It should hold only this demo data.
