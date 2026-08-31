# CustodyMap

Flagship-lite **personal-data custody atlas** by **Saeed Rumaneh**. Map synthetic sources → processors → stores, survey retention expiry, and rehearse access / delete request workflows.

> Synthetic demo only. No real personal data is collected or stored.

Graph and subject requests persist in `data/custody.json`. The App Router API seeds the demo graph on first run; submitting or advancing requests writes the file. Restart keeps your request desk state.

## Features

- Custody graph with path tracing helpers
- Retention expiry checks per processor/store
- Access & delete request state machine
- Atlas-style interactive map UI backed by JSON persistence

## API

- `GET /api/custody` — `{ graph, requests }`
- `POST /api/requests` — `{ type, subjectRef, storeIds }`
- `POST /api/requests/:id/advance` — move status along the workflow
- `POST /api/requests/:id/reject` — reject with optional note (UI)

## Stack

Next.js 15 · React 19 · TypeScript · Vitest

## Scripts

```bash
npm install
npm run dev
npm test
npm run typecheck
npm run build
```

http://localhost:3000 — submit requests, advance them, restart the app, the desk is unchanged.

## Complete product flows

1. Click a store on the map — purpose, region, and retention appear under the legend.
2. Submit an access request for `subj-demo-ada`, then **Advance** until fulfilled. Restart — the request is still in `data/custody.json`.
3. Drag “Days since collection” past a store’s retention — that row marks expired. Submit a delete request and **Reject** to leave a policy-hold note.

## Library

Core logic: [`lib/custody.ts`](lib/custody.ts) · Persistence: [`lib/store.ts`](lib/store.ts) · Tests: [`__tests__/custody.test.ts`](__tests__/custody.test.ts)

## Docs

- [SECURITY.md](SECURITY.md)
- [threat-model.md](threat-model.md)

## License

MIT © 2026 Saeed Rumaneh
