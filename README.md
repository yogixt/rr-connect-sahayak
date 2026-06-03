# RR Connect Sahayak

A deterministic, multi-language support chatbot for field electricians. Every reply
and option is pre-defined — **no AI, no LLM**. Built to be usable by people with limited
reading ability: large tap-only buttons, simple language, clear line icons, and smooth
animation.

It is a single Next.js app that deploys to **Vercel** — no separate backend, no database.

## How it works

```
Browser (Next.js)
  ├─ deterministic flow engine   lib/flow.ts        (runs in the browser)
  └─ pincode → ASM lookup        app/api/asm        (Vercel serverless route)
```

The conversation is a graph of nodes in `lib/flow.ts`. Each node has localized text and
a list of options; each option points to the next node. The engine only ever advances
along an allowed option, so the bot can never go off-script. Because every reply is
pre-defined and the graph holds no secrets, the flow runs client-side and every tap is
instant.

The only server-side piece is the pincode → ASM directory (≈39k rows, shipped as
`data/pincode_mapping.csv.gz`). The `/api/asm` route holds it and returns just the one
matching ASM, so the full phone list never goes to the browser.

- **Languages:** Hindi, English (fallback hi → en for missing strings).

## Run locally

```bash
npm install
npm run dev          # http://localhost:3200
```

That's it — no backend or database to start.

## Edit the content

Change what the bot says in `lib/flow.ts` (the `NODES` graph) — the dev server hot-reloads.
Adding a language = add its code to `LANGUAGES` in `lib/flow.ts` and provide the
translations on each node.

## Deploy

Push the repo and import it on **Vercel** — the project root is the repo root, so there
is nothing to configure. No environment variables, no backend, no database. The `/api/asm`
route runs as a Vercel function and the pincode data is bundled into it automatically
(see `outputFileTracingIncludes` in `next.config.ts`).

Because the flow runs in the browser and Vercel functions don't idle-sleep the way a free
always-on VM does, there is nothing to cold-start or keep alive.
