# VenturePath

**Sharia-compliant operating system for KSA founders.** Cap table,
fundraising, secondary trading, whole-company exits, and founder
partnerships — in one bilingual (EN/AR) platform anchored to verified
cap-table data.

- **Live:** https://venture-path.vercel.app/
- **Status:** v0.3.0.0 (2026-05-17). Five hubs shipped; v1.3 P0s
  flagged in `TODOS.md`.

## Documentation

- **Product:**
  - `docs/prd-venturepath.md` — formal PRD: document control, vision, KPIs,
    personas, user stories (US-S*/US-I*/US-T*/US-E*/US-P*/US-X* with priority),
    NFRs, risks, dependencies, release plan.
  - `docs/prd-venturepath-deep-dive.md` — hub-by-hub architecture + v1.2
    cross-workspace activation delta (features / requirements / user stories
    per shipped item).
  - `docs/prd-connections-hub.md` — deep-dive on Exit + Partnership
    Hubs (data model, RLS, inquiry handshake, design decisions).
- **Engineering:**
  - `DESIGN.md` — Kinetic Sovereign design system (papyrus + teal
    gradient, bilingual EN/AR + RTL).
  - `CHANGELOG.md` — versioned release history (4-digit MAJOR.MINOR.PATCH.MICRO).
  - `TODOS.md` — open work + external blockers + closed-item log.

## Tech stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript 5
- Supabase (Postgres 17, Auth, RLS, Edge Functions)
- Tailwind CSS 4 (logical properties for RTL)
- react-i18next (28 namespaces; EN + AR)
- Resend for transactional email
- Vercel for hosting; production branch
  `claude/activate-bypass-permissions-0sjk1`

## Getting started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Environment variables

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
```

### Common commands

```bash
npm run dev          # Next dev server with Turbopack
npm run build        # Production build
npm test             # vitest run (157 tests as of v0.3.0.0)
npx tsc --noEmit     # Type check
npx eslint app lib   # Lint
```

### Supabase migrations

Migrations live in `supabase/migrations/` and apply via the Supabase
MCP or `supabase db push`. Names are timestamped (`YYYYMMDDhhmmss_*.sql`)
and apply in chronological order. As of v0.3.0.0:

```
20260515*  Initial schema (workspaces, cap table, ESOP, compliance, vault, etc.)
20260516*  Connections Hub (exit + partnership listings, inquiry handshake)
20260517*  close_financing_round RPC
20260518*  account_notifications + triggers
20260519*  full_text_search, investor_update_recipients,
           transfer_agent_cap_table_sync, acquisition_models,
           seeking_type column promotion
20260520*  user_profiles, settings infra, inquiry_messages
```

### Tests

pgTAP suites under `supabase/tests/` exercise the RPC families. They
run against a local Supabase with pgTAP installed via
`supabase test db`. Live-DB verification is done via BEGIN/ROLLBACK
plain-SQL harnesses through the Supabase MCP — counts logged in the
relevant CHANGELOG entries.

## Hub map (where to find things in the code)

| Hub | Sidebar entry | Routes |
|---|---|---|
| Startup | "My Startup" (expandable) | `/dashboard`, `/company`, `/members`, `/governance`, `/compliance`, `/vault`, `/traction`, `/audit`, `/setup` |
| Investment | "Round" | `/cap-table`, `/esop`, `/rounds`, `/term-sheets`, `/investor-updates`, `/valuation`, `/dilution`, `/waterfall` |
| Trading | "Marketplace" | `/marketplace` (Browse + Mine tabs) |
| Exit | "Marketplace" Browse tab; `/connections?filter=exit` | `/connections`, `/connections/[id]`, `/acquisition` |
| Partnership | "Talents", "Advisors" | `/connections?seeking=…`, `/connections/[id]` |
| Platform | "Explore", "Messages", "Settings", "My profile" | `/explore`, `/messages`, `/messages/[id]`, `/settings`, `/profile`, `/profile/edit`, `/sign-in`, `/sign-up` |

Full hub-by-hub feature/requirement/user-story breakdown is in
`docs/prd-venturepath.md`.

## Deployment

The production branch is `claude/activate-bypass-permissions-0sjk1`
(not `main` — Vercel is configured to deploy from this branch). Pushes
to it auto-deploy.

## Contributing

This is a private repo for now. External contributions aren't
solicited; if you're inside the project, see `TODOS.md` for what's open
and `docs/prd-venturepath.md` §8.2 for v1.3 candidates.
