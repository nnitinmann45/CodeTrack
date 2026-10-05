# Understand the project

## A problem's journey through the app

1. The user fills the React form in `client/src/Dashboard.jsx`.
2. The `api` helper sends JSON to `POST /api/problems`; the browser includes the HTTP-only session cookie automatically.
3. Express checks the request origin and rate limits the request.
4. `authenticate` verifies the JWT signature, expiry, issuer/audience, and the account's token version.
5. Zod validates and normalizes the fields. The server takes the owner ID from the authenticated account, never the submitted body.
6. Mongoose inserts the document. A unique `(user, url)` index prevents duplicate point farming.
7. React reloads the list. The server calculates statistics from the current records, and React redraws the dashboard.

## API reference

All POST, PUT, PATCH, and DELETE browser calls require an `Origin` header matching APP_URL. The cron endpoint uses a separate bearer secret instead. With Postman/curl, supply the Origin header and use a cookie jar for authenticated calls.

| Method and path | Purpose |
| --- | --- |
| GET `/api/health` | Database connection health |
| POST `/api/auth/register` | Create account: name, email, password, optional timezone |
| POST `/api/auth/login` | Log in with email/password |
| GET `/api/auth/me` | Current profile and email configuration status |
| POST `/api/auth/logout` | Invalidate all account sessions and clear cookie |
| PATCH `/api/auth/settings` | Update name, timezone, remindersEnabled |
| POST `/api/auth/send-verification` | Send a one-hour verification link |
| POST `/api/auth/verify-email` | Consume a one-use verification token |
| GET `/api/problems` | Own records and derived statistics |
| POST `/api/problems` | Create record |
| PUT `/api/problems/:id` | Replace editable fields on own record |
| DELETE `/api/problems/:id` | Delete own record |
| POST `/api/jobs/reminders` | Run optional reminder job; bearer CRON_SECRET required |

## Database collections

`users`: name, normalized email, password hash, timezone, token version, reminder settings, verification state, timestamps.

`problems`: owning user, title, platform, normalized URL, difficulty, topic, date-only solvedDate, notes, timestamps.

No score field is accepted from the client. Score is the sum of difficulty weights across the user's stored records. Query strings and URL fragments are removed when normalizing a problem URL. This suits canonical problem links, but query-based URLs on an arbitrary Other platform may collide; use a unique canonical path link for those records.

## How streaks work

- Multiple problems on one date count as one practice day.
- Sort unique dates to calculate longest consecutive run.
- If today has practice, count backward from today.
- Otherwise count backward from yesterday: today is still an opportunity to continue.
- If neither today nor yesterday has practice, current streak is zero.
- Date arithmetic uses UTC calendar operations on date-only strings to avoid daylight-saving-hour errors; today's date is determined in the account's timezone.

## Authentication decisions

JWTs live in HTTP-only cookies so normal frontend code cannot read them. They expire after seven days. HTTPS deployments add Secure cookies; SameSite=Lax and strict origin checks protect state-changing routes against common cross-site request forgery paths. Passwords use bcrypt with cost 12. Token-version checks allow logout to invalidate existing tokens on every device; consequently authentication is not fully stateless despite using JWT.

There is no password reset in this version. Pick and retain a password when testing. Email verification exists only to gate optional reminders, not to block core app use. Do not call this a fully production-hardened authentication system.

## Learn in this order

1. `server/models/Problem.js`: what a stored record looks like.
2. `server/routes/problems.js`: CRUD and user isolation.
3. `server/lib/stats.js`: points, date math, badges.
4. `client/src/api.js`: fetch and error handling.
5. `client/src/main.jsx`: React context and login state.
6. `client/src/Dashboard.jsx`: forms, filters, and chart data.
7. `server/routes/auth.js`: registration and session lifecycle.
8. `server/lib/reminders.js`: eligibility, concurrency lease, and delivery.

## Interview questions you should be able to answer

- Why is a user's ID read from the verified session rather than request JSON?
- How does the unique index behave under two simultaneous duplicate inserts?
- Why does editing a difficulty also change the total score?
- Why is JWT in an HTTP-only cookie paired with an origin check?
- Why can node-cron miss a job on a sleeping server?
- What would you change for 100,000 problems per user? (Server-side pagination/filtering, indexed queries, aggregate statistics, and query limits.)
- What would you add before a public production launch? (Password recovery, abuse controls, monitoring, backup/recovery, stronger mail operations, persistent/distributed rate limiting, and broader deployment tests.)

## Possible resume wording after you deploy and verify it

- Built and deployed a MERN coding-practice tracker with authenticated, user-specific problem logging, search, filtering, and editing.
- Implemented derived points, timezone-aware streaks, achievement badges, and Chart.js progress visualizations.
- Added optional verified-email inactivity reminders using an authenticated scheduled job endpoint.

Use only claims you've personally configured and tested. Replace “added optional” with an actual delivery claim only after verifying delivered mail. Add your own customization and measured outcomes as you earn them.
