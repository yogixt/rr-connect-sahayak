# RR Connect Sahayak

A deterministic, multi-language support chatbot for field electricians. Every reply
and option is pre-defined and validated server-side — **no AI, no LLM**. Built to be
usable by people with limited reading ability: large tap-only buttons, simple language,
clear line icons, and smooth animation.

## How it works

```
Browser (Next.js)  ──HTTP──►  FastAPI  ──►  deterministic flow engine (seed.py)
                                  │
                                  └──►  Postgres (sessions + step log, for analytics)
```

The conversation is a graph of nodes in `backend/app/flow/seed.py`. Each node has
localized text and a list of options; each option points to the next node. The server
only ever advances along an allowed option, so the bot can never go off-script.

- **Languages:** Hindi, English, Marathi (fallback hi → en for missing strings).

## Run locally

Backend (with Docker):

```bash
docker compose up -d --build
# API on http://localhost:8000  (docs at /docs)
```

Or run the backend directly:

```bash
cd backend
uv sync                       # or: pip install -r requirements.txt
export DATABASE_URL=postgresql+asyncpg://bijli:bijli@localhost:5432/bijli_mitra
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
cp .env.local.example .env.local      # point NEXT_PUBLIC_API_BASE at the backend
npm install
npm run dev                            # http://localhost:3200
```

## Edit the content

Change what the bot says in `backend/app/flow/seed.py` and restart the backend.
Adding a language = add its code to `LANGUAGES` in `app/flow/engine.py` and provide the
translations on each node.

## Deploy

- **Frontend:** Vercel. Set `NEXT_PUBLIC_API_BASE` to the public backend URL.
- **Backend + Postgres:** any always-on host (single small VM is plenty — there is no
  model to run). Put it behind HTTPS and set `FRONTEND_ORIGIN` to the Vercel URL.
