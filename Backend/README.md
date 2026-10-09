# AWAAZ Backend — "AI that hears Chandigarh."

AI-powered civic complaint backend (Node.js + Express + PostgreSQL/Supabase).
Understands Hindi, Punjabi, English & Hinglish. Classifies, prioritizes, routes
to departments, merges duplicates, tracks status, powers the admin dashboard.

## Quickstart
    cp .env.example .env      # set DATABASE_URL (local Postgres or Supabase URI)
    npm install
    npm start                 # http://localhost:4000  (schema auto-creates)

Requires Node.js >= 18.

## Key endpoints
    GET    /health
    POST   /api/complaints
    GET    /api/complaints?status=&priority=&category=&department=&sector=
    GET    /api/complaints/:id
    PATCH  /api/complaints/:id/status
    GET    /api/dashboard/stats
    GET    /api/dashboard/hotspots
    GET    /api/meta

## Tests
    npm run test:unit         # no database needed
    createdb awaaz_test       # then, for full integration tests:
    npm test