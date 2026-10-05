# Deploy CodeTrack for free

Route: **GitHub source → Render Free web service → MongoDB Atlas Free database**.
The React frontend and Express API share one Render website. You do not need Vercel, a separate frontend URL, a purchased domain, or a paid database for the core app.

Plan information checked against official documentation on 5 October 2026. Providers can change limits; confirm **Free** on the final setup screens and review any billing prompt before proceeding.

## 1. Push the actual source files to GitHub

Create an empty GitHub repository named `CodeTrack`. Do not initialize it with another README if following these commands. In VS Code's project terminal:

```powershell
git init
git add .
git status
```

Check that `.env` and `node_modules` are absent. Then:

```powershell
git commit -m "Build CodeTrack coding practice tracker"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/CodeTrack.git
git push -u origin main
```

Replace YOUR_USERNAME with your actual GitHub username. Sign in if prompted. If Git requests your name/email, configure your own Git commit identity and retry the commit. Upload the extracted source, not just the ZIP. Never force-push an existing repository.

## 2. Create the Render service

1. Sign in at https://render.com and connect your GitHub account.
2. Choose **New → Web Service** (not Static Site).
3. Select your CodeTrack repository and `main` branch.
4. Configure:

| Setting | Value |
| --- | --- |
| Name | An available name, e.g. `codetrack-nitin` |
| Runtime | Node |
| Region | A suitable nearby region; near the Atlas database where possible |
| Root directory | Leave blank when package.json is at the repository root |
| Build command | `npm ci --include=dev && npm run build` |
| Start command | `npm start` |
| Instance type | **Free** |
| Health check path | `/api/health` |

`--include=dev` is important: Vite must be installed for the production build even though NODE_ENV is production.

## 3. Set the hosting environment variables

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `24` |
| `MONGODB_URI` | Your real Atlas URI with `/codetrack` database name |
| `JWT_SECRET` | A new random secret of at least 32 characters |
| `APP_URL` | Your exact assigned HTTPS Render website origin, without a path |
| `MAIL_PROVIDER` | `disabled` initially |
| `ENABLE_CRON` | `false` |

Example APP_URL: `https://codetrack-nitin.onrender.com`. Use **your assigned hostname**, not this example. If the hostname is shown only after service creation, update APP_URL as soon as it is available and redeploy. Login/register requests fail until it matches the real browser origin. Render provides PORT automatically; do not hard-code its assigned port.

Do not upload `.env` to GitHub or Render. Enter values in Render's Environment settings.

## 4. Permit the hosting service to reach Atlas

Find the web service's **Outbound IP addresses/ranges** in Render's dashboard (Connect/network details). Add the ranges it supplies to Atlas **Network Access**, alongside your own development IP. Atlas credentials still authenticate the connection.

Avoid opening the database to the whole internet (`0.0.0.0/0`) as a routine shortcut. If connection fails, compare the current Render outbound ranges with Atlas's access list and verify the database user's password and permissions.

## 5. Deploy and check

Start the deployment. If the first attempt happened before the network allowlist was ready, redeploy after fixing it.

Open your HTTPS website and:
1. Create your own account.
2. Add, edit, search, and delete a test problem.
3. Confirm points and charts change.
4. Log out, log back in, and confirm data persists.
5. Open `/api/health`; expect `{"status":"ok"}`.
6. Check the website on your phone.
7. Add the live URL to the GitHub repository's About/Website field and README.

If login reports an origin error, update APP_URL to the exact hostname you're using. A custom domain also needs APP_URL updated. One canonical origin is allowed intentionally.

## Free hosting limitations

- Render Free sleeps after 15 idle minutes. The next visit can take about one minute to wake it. This is suitable for a portfolio demo, not an always-available production service.
- Render allocates 750 free instance hours per workspace/month, shared by its free web services; bandwidth and build limits also apply.
- MongoDB Atlas Free offers 512 MB storage and can pause after extended inactivity. Check Atlas if a long-unused demo stops connecting.
- Data lives in Atlas, not Render's temporary filesystem.
- An in-process cron job cannot reliably execute while Render is asleep. Keep ENABLE_CRON false and use the optional external daily trigger described in EMAIL_REMINDERS.md.
- Render Free blocks standard SMTP ports. The included Resend HTTPS integration can send mail without those ports, subject to its account/domain requirements. Public email sending may require a domain you control; the core app needs no email provider.
- Do not configure frequent keep-alive requests to hide the sleeping behavior. Let the free service sleep normally.

## Deploy later changes

After testing edits locally, commit and push them. If Render auto-deploy is enabled, it rebuilds the service. Otherwise use Manual Deploy for the latest commit. Keep secret changes in Render's Environment settings.

## Official references

- https://render.com/docs/free
- https://render.com/docs/deploy-node-express-app
- https://render.com/docs/outbound-ip-addresses
- https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/
- https://www.mongodb.com/docs/atlas/security/ip-access-list/
