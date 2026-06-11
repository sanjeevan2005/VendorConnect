# VendorConnect / VendrSurf

AI-powered hardware procurement demo: create an RFQ, discover vendors, trigger qualification calls, and review vendor quotes in one dashboard.

## Monorepo Layout

- `apps/web` - Next.js frontend
- `apps/api` - FastAPI backend for RFQ parsing, vendor discovery, Vapi calls, and webhooks
- `supabase` - database migrations, seed data, and local Supabase config
- `run-frontend.ps1` - local frontend launcher for Windows
- `run-backend.ps1` - local backend launcher for Windows
- `.github/workflows/ci.yml` - frontend and backend verification

## Prerequisites

- Node.js 24 LTS with npm
- Python 3.12
- Supabase CLI if you want to run the database locally

The current workspace also has an optional `.tools/node` runtime, but clone reproducibility assumes normal Node/Python installs.

## Environment Setup

Create frontend env:

```powershell
Copy-Item apps\web\.env.local.example apps\web\.env.local
```

Create backend env:

```powershell
Copy-Item apps\api\.env.example apps\api\.env
```

Required for the real happy path:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`
- `ANTHROPIC_API_KEY`
- `CORS_ALLOW_ORIGINS`
- `CRUST_DATA_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPI_API_KEY`
- `VAPI_PHONE_NUMBER_ID`
- `VAPI_ASSISTANT_ID`
- `WEBHOOK_URL` for Vapi webhook delivery

Optional:

- `ANTHROPIC_MODEL`, default `claude-sonnet-4-6`
- `VENDOR_PHONE_OVERRIDE`, E.164 phone number for demo calls only. Leave blank to call the vendor phone from the database.

## Database

Supabase migrations and seed data live in `supabase`.

For local Supabase:

```powershell
supabase start
supabase db reset
```

Then copy the local Supabase API URL, anon key, service role key, and database URL values into the app env files.

For hosted Supabase, push/apply the migrations in `supabase/migrations` before running the app against that project.

## Run Locally

Backend:

```powershell
powershell -ExecutionPolicy Bypass -File .\run-backend.ps1
```

Health check:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/
```

Frontend:

```powershell
powershell -ExecutionPolicy Bypass -File .\run-frontend.ps1
```

Open http://127.0.0.1:3000.

The frontend renders bundled demo data without Supabase keys. Creating RFQs, discovering vendors, and calling vendors require the env vars above.

## Verification

Frontend:

```powershell
npm --prefix apps\web ci
npm --prefix apps\web run lint
npm --prefix apps\web run build
npm --prefix apps\web audit --audit-level=moderate
```

Backend:

```powershell
python -m venv apps\api\.venv
apps\api\.venv\Scripts\python.exe -m pip install -r apps\api\requirements.txt
apps\api\.venv\Scripts\python.exe -m compileall apps\api\main.py apps\api\vapi.py apps\api\prompts.py
apps\api\.venv\Scripts\python.exe -m pip check
```

## Integration Notes

Adding API keys makes the application able to reach the external services, but those services must also be configured consistently:

- Supabase schema must match the migrations in this repo.
- Supabase anon/service-role keys must point to the same project.
- Vapi assistant, phone number, API key, and webhook URL must be valid.
- `WEBHOOK_URL` must be public for real Vapi calls; use a tunnel such as ngrok for local webhook testing.
- Crust Data and Anthropic accounts must have access to the configured APIs/models.
