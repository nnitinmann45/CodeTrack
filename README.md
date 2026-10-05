# CodeTrack

A full-stack coding practice tracker built with **MongoDB, Express, React, and Node.js**.
Log solved problems from LeetCode, Codeforces, HackerRank, GeeksforGeeks, or another platform. See your points, streaks, activity, and achievements in a private dashboard.

**Start with [START_HERE.md](START_HERE.md).** Detailed guides:
- [Windows setup](docs/SETUP_WINDOWS.md)
- [Free deployment with Render + MongoDB Atlas](docs/DEPLOY_FREE.md)
- [Optional email reminders](docs/EMAIL_REMINDERS.md)
- [How the code works and interview preparation](docs/ARCHITECTURE.md)
- [Verification results](docs/TESTING.md)

## Features

- Registration and login; bcrypt password hashing; JWT session in an HTTP-only cookie.
- Each account can access only its own problem records.
- Add, view, edit, delete, search, and filter solved problems; pagination in the UI.
- Fields: title, URL, platform, difficulty, topic, solved date, and notes.
- Easy = 10 points; Medium = 20; Hard = 40. One normalized URL per user.
- Account-timezone-aware current streak, longest streak, and 84-day activity calendar.
- Chart.js practice and difficulty charts; six achievement badges; topic totals.
- Export personal problem records as JSON.
- Responsive desktop/mobile layout and keyboard-accessible native dialogs.
- Optional verified-email, opt-in inactivity reminders: Nodemailer SMTP or Resend HTTPS.
- Optional node-cron scheduler for always-on servers; external scheduled trigger for sleeping hosts.
- Input validation, request rate limits, origin checks, and server-side authorization.

## Run locally

Requires Node.js 22.12+ (Node 24 is the tested major version), npm, and MongoDB Atlas or local MongoDB.

```powershell
npm ci
Copy-Item .env.example .env
```

Edit `.env` with your MongoDB URI and a random JWT secret. Then:

```powershell
npm run dev
```

Visit **http://localhost:5173**. Development API: port 5000. Keep APP_URL set to the exact browser origin.

```powershell
npm test
npm run test:integration
npm run build
```

For a local production-build smoke test, keep `NODE_ENV=development`, set `APP_URL=http://localhost:5000`, run `npm start`, and open port 5000. For hosted deployment use `NODE_ENV=production` and your HTTPS APP_URL.

## Project map

```text
client/src/          React UI, authentication context, charts, styles
server/app.js        Express middleware, API routes, static frontend hosting
server/index.js      Database connection, startup, optional scheduler
server/models/      MongoDB schemas and indexes
server/routes/      Auth/settings and problem endpoints
server/middleware/  JWT authentication and session cookie helpers
server/lib/         Validation, statistics, mail, reminder delivery
tests/             Logic and real-MongoDB integration tests
docs/              Setup, deployment, reminders, architecture, testing
```

One npm install at the root covers both frontend and backend. Express serves the built React frontend in deployment, so there is one URL and no cross-origin cookie setup.

## Scope and honest project claims

This is a portfolio project, not a production SaaS platform. It does **not** automatically sync platform submissions, run submitted code, reset forgotten passwords, or include OAuth, teams, payments, or a leaderboard. Charts reflect manually entered records. Problem lists are fetched per account and filtered in the browser, suitable for a personal tracker rather than millions of records. Rate limits are per server process and reset on restart. Logout invalidates the account's sessions on all devices.

Badges and points are recalculated from current records; removing problems can remove achievements. Solved dates are date-only values; changing timezone does not rewrite them. Verification links expire after one hour. Email reminders require separate configuration; do not describe delivered emails as working until you configure and test them.

The project was generated with AI assistance. Review and understand the implementation, customize it, and describe your actual contribution and verified results in interviews. Do not claim measured engagement improvements or real users without evidence. Use actual development dates in your resume.

## Secrets

Never commit `.env`, database credentials, API keys, or JWT/cron secrets. `.gitignore` is included. Use hosting environment variables in deployment. `.env.example` contains placeholders only.
