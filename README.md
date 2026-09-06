# Legal Metrology Compliance Checker

A web app that scans packaged commodity labels and checks compliance against
India's Legal Metrology (Packaged Commodities) Rules, 2011.

Users sign up as an inspector, manufacturer, or admin, upload one or more
photos of a product label, and the app reads the mandatory declarations
(manufacturer, address, country of origin, commodity name, net quantity,
manufacturing/best-before dates, MRP, consumer care details, unit sale price),
then marks the pack compliant, non-compliant, or exempt — with each violation
graded critical/minor and cited to the specific rule it violates. Evidence
photos are kept per scan, and every scan is searchable in History by product,
manufacturer, date range, and status.

## Tech stack

- React + TanStack Start (SSR) + Vite
- Supabase (Postgres, auth, storage, row-level security)
- Google Gemini API for label OCR/field extraction
- Tailwind CSS + shadcn/ui components

## Environment variables

Copy `.env.example` to `.env` and fill in your own values:

```sh
cp .env.example .env
```

| Variable | Description |
|---|---|
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase publishable (anon) key |
| `GEMINI_API_KEY` | A Google AI Studio Gemini API key, used for label field extraction |

## Development

```sh
npm i
npm run dev
```

## Database

The Supabase schema (tables + RLS policies + storage bucket policies) lives in
`supabase/migrations/`. Run these against your own Supabase project via the
Supabase SQL editor or CLI before starting the app.
