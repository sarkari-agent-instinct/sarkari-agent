# Sarkari Agent

An official-source guide to Indian public-service processes, built for DEV's Sanity Challenge Path One. The app reads a structured Sanity dataset and Knowledge Base through Sanity Context MCP, returns procedural steps with official links, calls out conflicting source versions, and drafts complaint text with placeholders only.

## Current corpus

12 published source records cover CPGRAMS, FASTag/NETC, DPDP commencement, and NHAI complaints. Each record holds an official URL, authority, retrieved date, status, content, and, where relevant, a supersession reference or explicit conflict. The manifest is in `data/sources/manifest.json`. This is an informational demo, not legal advice. Do not enter real personal data.

The publicly readable Sanity dataset is project `7zf1vwv6`, dataset `production`. The Context MCP endpoint is `https://api.sanity.io/v1/context/organizations/od8ll2mge/mcp/sarkari-agent` and the KB is [Sarkari Agent official procedures](https://www.sanity.io/@od8ll2mge/context/knowledge-bases/kbUxZppxpSsw). A server-side organization Context Viewer token is required to use MCP. The Studio is at https://sarkari-agent-kb.sanity.studio/.

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_SANITY_PROJECT_ID=7zf1vwv6`, `NEXT_PUBLIC_SANITY_DATASET=production`, `SANITY_CONTEXT_MCP_URL` to the endpoint above, and the server-side `SANITY_CONTEXT_TOKEN` and `GOOGLE_GENERATIVE_AI_API_KEY`. Never commit tokens.
3. `npm run dev`
4. `npm run eval` runs the documented prompts against `http://localhost:3000` (or `EVAL_BASE_URL`).

`npm run typecheck` and `npm run build` check the app. `npm run deploy:studio` deploys the Studio using a separately authenticated Sanity CLI. `npm run import:sources` requires a project write token and refreshes the corpus; the import script fetches official pages and rejects unreachable or empty content.

## Answer contract

The API returns a summary, ordered steps, optional placeholder-only draft, explicit conflicts when sources disagree, and official source cards. It checks date and supersession rather than merging old and new official guidance. If the corpus lacks a procedure, it should say so instead of inventing steps.
