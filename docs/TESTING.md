# Verification record

Prepared on 5 October 2026. Runtime: Node 24.19.0.

## Passed here

- Dependency installation and lockfile-based reinstall.
- `npm run build`: React/Vite production build succeeded.
- `npm test`: 9 passing tests covering statistics, leap/year date boundaries, timezone conversion, URL/date validation, unauthorized access, origin checks, malformed JSON, invalid auth inputs, and cron-secret protection.
- `npm audit --omit=dev --audit-level=high`: reported zero known runtime dependency vulnerabilities at packaging time. This is a package advisory check, not a security certification.

## Not verified here

- **Real MongoDB integration:** the temporary MongoDB test server was blocked by this execution environment (`open: Operation not permitted`). The included 3 database integration tests therefore could not execute successfully here. Run `npm run test:integration` on your laptop; these exercise registration/login, real MongoDB CRUD, account isolation, duplicate indexes, session revocation, verification tokens, and reminder eligibility with a simulated mail provider. They use their own disposable database, not your Atlas database.
- **Browser end-to-end and visual QA:** browser installation could not complete in this environment. The production bundle was compiled, but rendered desktop/mobile workflows still need browser verification.
- **Atlas connection and Render deployment:** require your accounts and credentials.
- **Email delivery:** requires your configured provider, valid sender, and verified recipient. No real emails were sent.

## Your acceptance checklist

1. Start the app and register two separate accounts.
2. Add problems in account A; verify B cannot see them.
3. Confirm a duplicate problem URL is rejected for A but can be added by B.
4. Edit a difficulty and check the point total changes.
5. Filter by platform/difficulty/topic and search by title or notes.
6. Add yesterday's and today's problems; check the current streak and activity calendar in your account timezone.
7. Delete a record and verify points/badges recalculate.
8. Log out, then log back in; records should remain in MongoDB.
9. Export JSON and check it contains only your own records.
10. Check the dashboard, dialog forms, settings, and logout on a phone-sized screen.
11. After deployment, repeat core registration/login/CRUD checks at the HTTPS URL.
12. Configure and test emails only if you want that optional feature.

Do not claim all integration or deployment checks passed based only on the successful build.
