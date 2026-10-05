# Start here, Nitin

This ZIP contains the complete source code. You do not need to create each file yourself.

## Step 1 — Open the project

1. Right-click the ZIP and choose **Extract All**.
2. Put the extracted `CodeTrack` folder somewhere convenient, for example `D:\Projects\CodeTrack`.
3. Open VS Code → **File → Open Folder** → choose the folder containing `package.json`.
4. Open **Terminal → New Terminal**.
5. Run these separately:

```powershell
node -v
```

```powershell
npm -v
```

Send those two outputs to ChatGPT. We can walk through the remaining steps one at a time.

## What comes next

1. Install dependencies (`npm ci`).
2. Create your MongoDB Atlas free cluster and database user.
3. Copy `.env.example` to `.env`, fill in the database connection and random JWT secret.
4. Run locally (`npm run dev`) and create your own account.
5. Add a few real problems, verify the flow, and learn the code.
6. Push the source folder to GitHub, without `.env` or `node_modules`.
7. Deploy the Node web service on Render Free and keep the database on Atlas Free.
8. Add your real GitHub repository and live website URLs to your resume.

The full instructions are in `docs/SETUP_WINDOWS.md` and `docs/DEPLOY_FREE.md`. You can follow them independently or ask for one step at a time.

**The app is not already deployed.** You will connect your own GitHub, Atlas, and hosting accounts. No secret values are included. The ZIP excludes dependencies and generated build files; npm downloads dependencies and builds the frontend.
