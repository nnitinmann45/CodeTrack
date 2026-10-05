# Optional inactivity reminders

The core tracker runs without email. Leave `MAIL_PROVIDER=disabled` while setting up your first deployment.

The implementation includes HTML email, verified address checks, opt-in settings, an inactivity check, and a database lease to avoid overlapping runs. It sends at most once per 24 hours per account, to up to 100 eligible accounts per invocation. A rare failure after the provider accepts mail but before MongoDB records success may cause a retry to duplicate a message; this is not an exactly-once delivery system.

## On Render Free: use HTTPS email

Render Free blocks outgoing SMTP ports 25, 465, and 587. Use the included Resend HTTPS implementation instead of Nodemailer SMTP there.

1. Create an account at https://resend.com and create an API key.
2. For a personal test, Resend's `onboarding@resend.dev` sender can send only to the email associated with your Resend account. Register CodeTrack using that same address for this test.
3. Sending to other users requires a verified domain you control. The Render `onrender.com` hostname is not a domain whose email DNS you control. A purchased domain may cost money; public email is therefore not promised as a fully free feature.
4. Set hosting variables:

```dotenv
MAIL_PROVIDER=resend
RESEND_API_KEY=your-private-api-key
MAIL_FROM=CodeTrack <onboarding@resend.dev>
ENABLE_CRON=false
CRON_SECRET=a-separate-random-secret-of-at-least-32-characters
```

Use a sender on your verified domain instead when configured. Generate CRON_SECRET the same way as JWT_SECRET, but use a different generated value.

5. Redeploy. In CodeTrack → Settings, click **Send verification email**. Open the link, then enable reminders and save.
6. Your account must be at least two days old and have no solved date today or yesterday to receive an inactivity reminder.

## Schedule one daily run with GitHub Actions

A sleeping free host cannot reliably run node-cron. An external scheduler can invoke the protected endpoint once per day. This is a real daily job, not a keep-alive workaround.

An example is included as `docs/reminders-workflow.yml.example`. To activate it deliberately:
1. Create `.github/workflows` in your repository.
2. Copy the example to `.github/workflows/reminders.yml`.
3. In GitHub repository **Settings → Secrets and variables → Actions**, add:
   - Repository variable `CODETRACK_URL`: your HTTPS website origin.
   - Repository secret `CODETRACK_CRON_SECRET`: exactly the CRON_SECRET set on Render.
4. Commit and push the workflow to the default branch.
5. Use the workflow's manual **Run workflow** button to test. It can legitimately report `sent: 0` if nobody is eligible.

The schedule is 03:47 UTC (09:17 India time). GitHub schedules can be delayed; on inactive public repositories they can be disabled after 60 days without repository activity. Public repository use of standard GitHub-hosted runners is generally free; private repositories have plan-dependent minutes. Review your account limits. Do not run both the internal cron and the external scheduler.

## Nodemailer on a compatible host

For local development or hosting that permits SMTP, set:

```dotenv
MAIL_PROVIDER=smtp
MAIL_FROM=CodeTrack <your-verified-sender@example.com>
SMTP_HOST=your-provider-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password-or-app-password
```

For an always-on server, set `ENABLE_CRON=true` to run at 09:00 Asia/Kolkata daily. The computer must stay running if you test it locally. Use provider-specific app passwords where required, not your regular email password.

## Verify delivery

- Send and open a verification email first.
- Enable reminders in Settings.
- Test the external workflow after an account becomes eligible, or test with a separate development database.
- Confirm the email actually arrives before claiming successful delivery.
- Turn off reminders in Settings to opt out.
- Never share API keys, cron secrets, or SMTP passwords.

No real emails were sent when creating this ZIP; provider calls were not exercised against your account.

References:
- https://render.com/docs/free
- https://resend.com/docs/knowledge-base/403-error-resend-dev-domain
- https://resend.com/docs/send-with-nodejs
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule
