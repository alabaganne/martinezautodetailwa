# No-Show Fee Cron Setup

This document explains how to deploy and run the no-show fee job in Vercel. It assumes the serverless route already exists at `app/api/cron/charge-no-show/route.ts`.

- **Expose the job** as a route in `app/api/cron/charge-no-show/route.ts` (already present in this commit). This route mirrors the CLI script’s logic and returns a JSON summary.
- **Protect the route** with `NO_SHOW_CRON_SECRET` (or reuse `CRON_SECRET`). Vercel will send this token as the `Authorization` or `x-cron-secret` header, preventing public access.
- **Set Square credentials** in Vercel’s environment: `SQUARE_ACCESS_TOKEN`, `SQUARE_ENVIRONMENT`, `NO_SHOW_GRACE_PERIOD_HOURS`, `NO_SHOW_LOOKBACK_DAYS`, and `NO_SHOW_CRON_SECRET`. Remember to expose them in the “Production” environment (and preview if you test there).
- **Add a cron entry** to `vercel.json`. Example below runs daily at 8:00 am PT (converted to UTC):

  ```json
  {
    "crons": [
      {
        "path": "/api/cron/charge-no-show",
        "schedule": "0 15 * * *"
      }
    ]
  }
  ```
  Update the schedule to your preferred time. Cron uses UTC.
- **Redeploy** so Vercel picks up the cron definition and environment variables. Confirm in the deployment logs that cron is registered.
- **Manual trigger:** run locally or with `curl` to confirm it works before relying on cron:
  ```bash
  curl -H "x-cron-secret: $NO_SHOW_CRON_SECRET" https://<your-vercel-app>/api/cron/charge-no-show
  ```
  Expect a JSON response summarizing processed bookings, charges, and errors.
