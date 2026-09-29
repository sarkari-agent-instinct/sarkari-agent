# Sarkari Agent

A source-grounded guide to Indian government and public-service processes, built for DEV's Sanity Challenge Path One.

Users describe a problem in plain English. The agent queries a structured Sanity Knowledge Base through **Sanity Context MCP**, returns exact steps with official links, flags conflicting official documents, and drafts complaint/form text with placeholders.

## Why this is different

- Structured procedure records, not a flat keyword dump
- Schema-aware MCP retrieval using `initial_context`, `schema_explorer`, `groq_query`, and `array_field_reader`
- Explicit version, status, effective-date, supersession, and conflict fields
- Citations for every action-driving claim
- Synthetic demo scenarios only

## Corpus

12 curated records from DARPG/CPGRAMS, IHMCL, MeitY, Passport Seva, and NHAI. See `data/sources/manifest.json`.

## Local setup

1. Create a Sanity project and deploy the Studio schema.
2. Import curated source records.
3. Publish a Sanity Context document scoped to `_type == "sourceDocument"` with embeddings enabled.
4. Copy `.env.example` to `.env.local` and fill server-side credentials.
5. `npm install && npm run dev`

No token is exposed to the browser. No real personal data is in the demo.

## Answer contract

Each response contains: summary, ordered steps, optional placeholder-only draft, explicit source conflicts, and official source cards.

## Evaluation

`data/evals/cases.json` includes 13 exact-answer cases, including two conflict/version tests. Run with `npm run eval` against a configured app.
