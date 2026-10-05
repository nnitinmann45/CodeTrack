# Windows local setup

## 1. Check Node and npm

Open the extracted folder in VS Code. Its Explorer should show `package.json`, `client`, and `server`.

In the terminal run `node -v`, then `npm -v`. Use Node 24 LTS from https://nodejs.org/en/download if you need an installation. The project requires at least Node 22.12. Restart VS Code after installing Node.

If PowerShell blocks `npm.ps1`, use `npm.cmd` wherever this guide says `npm`, or select **Command Prompt** as the terminal profile. You do not need to weaken system execution policy.

## 2. Install dependencies

```powershell
npm ci
```

Run this in the folder containing `package.json` and `package-lock.json`, not the parent folder. It downloads the packages needed by both halves of the app. Do not upload the resulting `node_modules` folder to GitHub.

## 3. Create the database

1. Open https://www.mongodb.com/cloud/atlas/register and sign in.
2. Create a project named CodeTrack if necessary.
3. Create a **Free / M0** cluster. Do not select a paid tier or add paid services.
4. Under Database Access, create a database user with a strong password and `readWrite` access to the `codetrack` database. This is separate from your Atlas login.
5. Under Network Access, add your current public IP for local development.
6. Choose **Connect → Drivers → Node.js** and copy the connection string.
7. Replace username/password placeholders locally. Use the `codetrack` database name after the hostname slash, before `?`.

Example only:

```text
mongodb+srv://YOUR_USER:YOUR_ENCODED_PASSWORD@YOUR_CLUSTER.mongodb.net/codetrack?retryWrites=true&w=majority
```

URL-encode special characters in the username/password. Never paste your real URI or password into a public issue, screenshot, or chat. If sharing an error, replace credentials with `***`.

You can alternatively install MongoDB locally and use `mongodb://127.0.0.1:27017/codetrack`. Atlas does not require a local MongoDB installation.

## 4. Create environment settings

PowerShell:

```powershell
Copy-Item .env.example .env
```

Command Prompt alternative: `copy .env.example .env`.

Open `.env` in VS Code. Fill in your `MONGODB_URI` and generate a JWT secret:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Paste that generated value into `JWT_SECRET`. Keep the rest initially:

```dotenv
NODE_ENV=development
PORT=5000
APP_URL=http://localhost:5173
MAIL_PROVIDER=disabled
ENABLE_CRON=false
```

Do not use the placeholder JWT secret from `.env.example`; startup deliberately rejects it.

## 5. Start both parts

```powershell
npm run dev
```

Wait for the API message and Vite local URL. Open exactly **http://localhost:5173**. Keep the terminal open. Use Ctrl+C to stop.

Create an account, log a solved problem, edit it, filter it, open Achievements, then log out and log in. Data persists in MongoDB between restarts.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `node` is not recognized | Install Node, then restart VS Code. |
| Cannot find `package.json` | Open the extracted CodeTrack folder and use its terminal. |
| API fails to connect | Atlas IP allowlist, database user/password, URI database name, and whether the cluster is paused. |
| Origin rejected | APP_URL must be `http://localhost:5173` for `npm run dev`. Do not use `127.0.0.1` in the browser. |
| Port 5173 or 5000 already used | Stop the earlier CodeTrack terminal or the other process using that port. |
| Changed `.env` has no effect | Stop and restart `npm run dev`. |
| Cookie/login issue after production experiment | Set NODE_ENV back to development and use the intended localhost port; clear localhost cookies if necessary. |
| Reminder controls disabled | Expected until email delivery is configured and your address is verified. |
| `npm run test:integration` download error | Tests download a temporary MongoDB binary the first time; internet access is required. This is separate from your Atlas database. |

## Local checks

```powershell
npm test
npm run test:integration
npm run build
```

Tests use an isolated temporary database, never your configured Atlas database. `npm run build` produces `client/dist`. Build output is regenerated during deployment, so it is ignored by Git.
