# PRD: VenturePath

**Version:** 1.2 (product-wide)
**Status:** v0.2.0.0 shipped; v1.1 surface restructure shipped 2026-05-16; v1.2 cross-workspace activation + UX hardening shipped 2026-05-17
**Owner:** Waleed Alsanosi
**Repo:** waleedahmedalsanosi/VenturePath
**Audience:** Product team — for hub-level scope and release sequencing.
**Companion docs:**
- `docs/prd-connections-hub.md` — deep-dive on the Exit + Partnership Hubs (data model, RLS, inquiry handshake)
- `DESIGN.md` — Kinetic Sovereign design system (papyrus + teal gradient, bilingual EN/AR + RTL)
- `CHANGELOG.md` — versioned release history
- `TODOS.md` — external blockers and deferred work

### Changelog

- **v1.2 (2026-05-17):** Cross-workspace activation pass. Every hub's
  cross-workspace discovery surface is now operational end-to-end: `is_public`
  toggles closed the publish gap on rounds and share listings; a real
  `account_notifications` aggregation lights up the header bell;
  full-text search wires the ⌘K command bar; per-recipient open tracking
  closes the investor-update loop. Plus a 6-batch UX hardening pass on
  sidebar reliability, profile completeness, account-settings depth, shared
  UI hygiene, dilution validation, threaded messaging, and equity-terms
  gating. See §13 for the full delta and §8.1 for the updated release ledger.
- **v1.1 (2026-05-16):** Surface restructure. Hubs surfaced as top-level
  sidebar entries; `/messages` inbox, `/settings`, `/profile` added; split-
  layout auth pages.
- **v1.0 (2026-05-16):** Initial product-wide PRD organising the codebase
  into five hubs + platform layer.

---

## 1. Executive Summary

**VenturePath is the Sharia-compliant operating system for KSA founders.**
Cap table, fundraising, secondary trading, whole-company exits, and founder
partnerships — all in one bilingual (EN/AR) platform anchored to verified
cap-table data. No fund movement on platform; every transaction closes
off-platform under existing KSA legal frameworks.

The product is organised into **five hubs** that map to the lifecycle of a
KSA startup. Each hub is independently usable and independently shippable.
The hub split is not a UI label — it is the unit of product scope, sales
positioning, and release sequencing.

| Hub | One-line | Status |
|---|---|---|
| **Startup Hub** | The workspace itself: company identity, team, governance, compliance, traction, vault. | Shipped (v0.1.0); user profile (display name + bio + avatar) added v1.2 |
| **Investment Hub** | End-to-end fundraising: cap table, instruments, rounds, term sheets, investor updates, modelling. | Shipped (v0.1.0); atomic round-close RPC + publish toggle + dilution validation + per-recipient open tracking + M&A modeler added v1.2 |
| **Trading Hub** | Secondary share marketplace: existing shareholders posting their equity for sale. | Shipped (v0.1.0); cross-workspace browse v1.1; publish toggle + transfer-agent cap-table sync added v1.2 |
| **Exit Hub** | Whole-company exits: founders listing their company for sale, acquisition, or merger. | Shipped (v0.2.0.0); cross-workspace browse v1.1; M&A modeler + acquisition-model history added v1.2 |
| **Partnership Hub** | Founder partnerships: co-founders, advisors, senior hires, business partners. | Shipped (v0.2.0.0); Talents/Advisors role filter v1.1; equity-terms gating + first-class seeking_type column added v1.2 |

Plus a **Platform Layer** (auth, i18n, multi-workspace, messages inbox,
discovery, data room) that every hub relies on.

## 2. Vision and Problem

### 2.1 Vision

> Every KSA founder running on the same operating system — bilingual,
> Sharia-compliant, KSA-first — from incorporation through exit.

### 2.2 The four problems we solve

1. **Cap-table chaos.** Founders manage equity in Excel until it breaks.
   No Sharia-compliant tooling exists; importing US-bolted products like
   Carta requires converting iSAFE/SAFE Sharia logic to product features
   they don't have.
2. **Fundraising fragmentation.** Round-running is spread across Excel,
   email, Drive, and WhatsApp. No structured pipeline, no auto-conversion
   of iSAFEs on close, no consistent investor-update voice.
3. **Trapped equity.** Shareholders who want to sell part of their equity
   have no posted-ask bulletin board with built-in ROFR — they negotiate
   over WhatsApp or use brokers.
4. **Broken founder marketplaces.** Two parallel problems with the same
   structural fix: founders wanting to exit, and founders wanting
   co-founders/advisors/hires/partners. Both currently live in LinkedIn DMs,
   Telegram founder groups, or paid brokers — slow, opaque, noisy.

### 2.3 Why VenturePath wins

- **Sharia-compliant by design.** iSAFE is the wedge — convertible
  instrument built for Sharia compliance and KSA market reality.
- **KSA-first, not US-bolted.** SAR-native, ZATCA-aware, Hijri-friendly,
  bilingual EN/AR with full RTL, Cairo + Inter typography throughout.
- **Verified-data moat.** Every listing is anchored to a verified cap
  table and audited financials on platform. AngelList and Acquire.com
  have anonymous profiles; we have cap-table receipts.
- **Off-platform closing.** No fund custody, no settlement risk. Aligned
  with CMA broker-dealer reality and Sharia jurisprudence.
- **Bilingual all the way down.** Not just translated UI — every page
  works in RTL with logical properties; every email template has Arabic
  variants; every chart and figure handles Arabic numerals.

## 3. Target Users and Personas

| Persona | Primary hub(s) | Wedge action |
|---|---|---|
| **Founder, pre-seed/seed** | Startup, Investment | Set up cap table, run a round, send investor updates. |
| **Founder, late-stage** | Investment, Exit, Trading | Model dilution / waterfall; list for exit; let early shareholders post secondary asks. |
| **Founder, partnership-seeking** | Partnership | Find co-founder / advisor / senior hire / business partner. |
| **Operator (senior hire, advisor)** | Partnership | Browse partnership listings, send inquiry, accept equity grant. |
| **Existing shareholder (employee, angel)** | Trading | Post secondary ask; respond to ROFR notifications. |
| **Acquirer / strategic** | Exit | Browse companies open to exit; send inquiry; gain scoped data-room access. |
| **Investor (LP-backed VC, angel, family office)** | Investment, Trading, Exit | Browse open rounds, secondary listings, exit listings; assess via verified data. |

The exit-buyer and partnership-inquirer personas were not pre-validated
with named individuals at launch — both rely on the seller-side personas
(Samir, Saif) being correct first.

## 4. Product Principles (non-negotiable)

These are the lines we don't cross. Any feature proposal that violates one
needs explicit founder approval, not just a PM signoff.

1. **No fund movement on platform.** VenturePath is a bulletin board /
   structured-data layer; closing happens off-platform with lawyers and
   regulators. This is both a Sharia choice and a CMA choice.
2. **Sharia-compliant by default.** iSAFE green identity is permanent.
   New instruments require Sharia advisor (Turky) sign-off before ship.
3. **Bilingual EN/AR + full RTL.** No English-only surface ever ships to
   production. Arabic font is Cairo; logical properties (`start`/`end`,
   `ps-`/`pe-`) not physical (`left`/`right`).
4. **Verified data wins.** A listing without a backing cap table is
   inferior to one with. Public profiles, exit listings, partnership
   listings, secondary listings — all anchored to workspace identity.
5. **Opt-in cross-workspace visibility.** Workspace data is private by
   default. Cross-workspace discovery requires the seller/founder to
   explicitly flip `is_public=true` per row. This is the Sharia-aligned
   default (avoid `gharar`/uncertainty in implicit disclosure).
6. **Off-platform contact reveal.** Cross-workspace contact details are
   exchanged via email after a structured handshake, not via on-platform
   DMs. Workspace boundary is preserved.
7. **Tamper-proof audit trail.** Every state transition on a regulated
   entity (cap-table mutation, listing accept/withdraw, round close)
   writes to `audit_events`, which is immutable at the DB trigger level.

## 5. Product Architecture: The Five Hubs

### 5.1 Mental model

```
            ┌──────────────────────────────────────────────────┐
            │              PLATFORM LAYER                      │
            │  Auth · i18n EN/AR · Multi-workspace · Messages  │
            │  Discovery (/explore) · Data Room tokens · Audit │
            └──────────────────────────────────────────────────┘
                                  ▲
       ┌─────────┬────────────────┼────────────────┬─────────┐
       │         │                │                │         │
  ┌────────┐ ┌─────────┐ ┌────────────┐ ┌────────┐ ┌────────────┐
  │ Startup│ │Investmnt│ │  Trading   │ │  Exit  │ │Partnership │
  │   Hub  │ │   Hub   │ │    Hub     │ │  Hub   │ │    Hub     │
  │        │ │         │ │ (Secondary)│ │ (Whole)│ │ (Human)    │
  └────────┘ └─────────┘ └────────────┘ └────────┘ └────────────┘
```

Each hub is an entry point in the sidebar and owns one or more app routes.
Hubs share the platform layer; they do not depend on each other (with one
exception: the Exit Hub blocks Trading Hub posts in the same workspace —
see §5.4).

### 5.2 Hub-to-route map

| Hub | Sidebar entry | Primary routes |
|---|---|---|
| **Startup Hub** | "My Startup" (expandable) | `/dashboard`, `/company`, `/members`, `/governance`, `/compliance`, `/vault`, `/traction`, `/audit`, `/setup` |
| **Investment Hub** | "Round" (top-level) | `/cap-table`, `/esop`, `/rounds`, `/term-sheets`, `/investor-updates`, `/valuation`, `/dilution`, `/waterfall` |
| **Trading Hub** | "Marketplace" (top-level) | `/marketplace` (Browse + Mine tabs) |
| **Exit Hub** | "Marketplace" Browse tab; `/connections?filter=exit` | `/connections`, `/connections/[id]`, `/acquisition` (M&A modelling) |
| **Partnership Hub** | "Talents", "Advisors" (top-level) | `/connections?seeking=…`, `/connections/[id]` |
| **Platform** | "Explore", "Messages", "Settings", "My profile" | `/explore`, `/messages`, `/settings`, `/profile`, `/sign-in`, `/sign-up` |

### 5.3 What lives where

The split is opinionated. When in doubt:
- **Startup Hub** is about *being* a company (identity, governance, ops).
- **Investment Hub** is about *raising capital* (equity instruments, rounds).
- **Trading Hub** is about *individual shareholders moving equity* between
  themselves (secondary).
- **Exit Hub** is about *the company moving as a whole* (acquisition, sale).
- **Partnership Hub** is about *humans joining the company* (co-founder,
  advisor, senior hire, business partner).

### 5.4 Cross-hub invariants

A few rules enforced at the database level that span hubs:

| Invariant | Hubs touched | Enforced in |
|---|---|---|
| A workspace cannot have an open Exit listing AND open secondary share listings simultaneously | Trading + Exit | `create_share_listing` RPC; `create_connection_listing` RPC |
| A workspace cannot have an open Exit listing AND an open Partnership listing | Exit + Partnership | `create_connection_listing` RPC |
| One open Exit listing per workspace | Exit | `create_connection_listing` RPC |
| Closing a Round auto-converts iSAFE/SAFE/CN to ordinary; cap table updates atomically | Investment | `close_financing_round` RPC |
| Accepting a connection inquiry mints a scoped `data_room_links` token | Exit + Partnership + Platform | `accept_connection_inquiry` RPC |

## 6. The Five Hubs — Detail

### 6.1 Startup Hub

**Purpose.** The workspace itself — everything about being a KSA startup
that isn't fundraising, trading, exiting, or hiring. The boring,
non-negotiable infrastructure.

**Primary user.** Founder + co-founders + early employees who need
visibility into the workspace.

**Features.**

| Feature | Status | Route | Description |
|---|---|---|---|
| Dashboard | Shipped | `/dashboard` | Tiles: cap-table health, recent round, recent activity, Connections pulse. |
| Company info & public profile | Shipped | `/company` | Editable workspace identity (name, one-liner, sector, stage, city). Toggle to publish on `/explore`. |
| Members & roles | Shipped | `/members` | Add/remove workspace members. Roles: owner, admin, viewer. Invite by email with signed token. |
| Governance | Shipped | `/governance` | Board meetings (agenda, minutes), resolutions (templated). |
| Compliance | Shipped | `/compliance` | KSA-specific obligations: ZATCA, GAZT, MOC. Due-date tracker with reminders. |
| Document Vault | Shipped | `/vault` | Tiered document storage (intro / standard / diligence). Signed share-link tokens; no workspace grant needed. |
| Traction | Shipped | `/traction` | MRR, customers, runway. Private by default; toggle to publish on `/explore`. |
| Audit | Shipped | `/audit` | Append-only ledger of every regulated state change. Tamper-proof at DB level. |
| Onboarding setup | Shipped | `/setup` | New-workspace flow. Reused for "+ New startup" from sidebar. |

**Data model footprint.** `workspaces`, `workspace_members`,
`board_meetings`, `board_resolutions`, `compliance_obligations`,
`data_room_links`, `data_room_documents`, `traction_metrics`,
`audit_events`.

**v1.1 changes.** None. The Startup Hub kept the same routes when the
sidebar restructured around top-level hubs.

**Open items.** Permissions UI for non-owner roles (admin vs viewer
distinctions are partial). Compliance reminders use email but not push.

### 6.2 Investment Hub

**Purpose.** End-to-end fundraising. From issuing the first iSAFE to
closing a priced round and updating the cap table atomically.

**Primary user.** Founder during a raise; investors get scoped read
access via the data-room token mechanism.

**Features.**

| Feature | Status | Route | Description |
|---|---|---|---|
| Cap Table | Shipped | `/cap-table` | Shareholders, instruments (iSAFE green, SAFE, Convertible Note, Ordinary), per-class breakdown, fully-diluted view. |
| ESOP | Shipped | `/esop` | Option pool size, grants per teammate, vesting schedules, vested-at-date math. |
| Rounds | Shipped | `/rounds` (Open tab + Mine tab) | Round pipeline: draft → open → closed. Per-round investor pipeline, term sheets, signed-share-link diligence. Cross-workspace open-rounds browse (v1.1). |
| Term Sheets | Shipped | `/term-sheets` | Templates per instrument type. Round-attached or standalone. |
| Investor Updates | Shipped | `/investor-updates` | Templated update emails. Recipient lists per round. Resend integration. |
| Valuation | Shipped | `/valuation` | Pre-money, post-money, instrument conversion preview. |
| Dilution | Shipped | `/dilution` | Scenario modelling: "what if we raise X at Y pre-money." |
| Waterfall | Shipped | `/waterfall` | Liquidation preference + participation math per instrument class. |
| iSAFE/SAFE/CN auto-conversion on round close | Shipped | `close_financing_round` RPC | Atomic cap-table mutation. |

**Data model footprint.** `instruments`, `shareholders`,
`share_holdings`, `option_grants`, `option_pool_events`,
`financing_rounds`, `round_investors`, `term_sheets`, `investor_updates`,
`investor_update_recipients`, `valuation_runs`.

**v1.1 changes.** `/rounds` got a Browse / Mine tab split. Browse queries
`financing_rounds WHERE is_public=true AND status='open'` across all
workspaces. Founders opt in per round.

**Open items.**
- **Publish flow UI for `financing_rounds.is_public`.** The flag exists
  and the cross-workspace query works, but there is no UI to flip it
  from inside the app — currently opt-in by SQL only. Without this,
  fresh-workspace Browse tabs are empty. **P0 follow-up.**
- Cross-investor messaging is intentionally absent (no on-platform DMs);
  contact happens via investor-update email threads.

### 6.3 Trading Hub

**Purpose.** Secondary equity marketplace. An existing shareholder
(employee with vested options, angel, ex-employee) can post part of
their equity for sale. Built-in ROFR notifications to other existing
shareholders.

**Primary user.** Selling shareholder; buyer is typically another
existing shareholder or a new investor identified off-platform.

**Features.**

| Feature | Status | Route | Description |
|---|---|---|---|
| My listings | Shipped | `/marketplace` (Mine tab) | Workspace-internal management view. Status: open, withdrawn, sold off-platform. |
| Public secondary browse | Shipped (v1.1) | `/marketplace` (Browse tab, default) | Cross-workspace public listings where seller opted in (`is_public=true`). Co-located with exit listings (see Exit Hub). |
| ROFR notifications | Shipped | Server side | On new listing, existing shareholders are notified by email and shown an Exercise / Decline action. |
| Listing detail | Shipped | `/marketplace/[id]` | Public summary, ask price, shares offered, ROFR row per existing shareholder. |
| Posted-ask model (no fund movement) | Shipped | DB constraint | The listing is a bulletin-board ask; closing happens off-platform with SPA + board consent + registry update. |
| Bidirectional exit collision | Shipped (v0.2.0.0) | `create_share_listing` RPC | A workspace with an open Exit listing cannot post secondary shares — whole-company sale supersedes individual share sales. |

**Data model footprint.** `share_listings`, `share_listing_rofr_events`.

**v1.1 changes.**
- Browse tab is now the default; "Mine" is opt-in via `?tab=mine`.
- Browse co-locates secondaries with exits — buyers see "shareholders
  selling part of their equity" and "companies open to whole-company
  sale" in the same surface.

**Open items.**
- **Publish flow UI for `share_listings.is_public`.** Same gap as
  Investment Hub — flag exists, no in-app toggle. **P0 follow-up.**
- Match engine, anonymous tier, auction format, multi-shareholder bundle
  listings — all explicit v2.

### 6.4 Exit Hub

**Purpose.** Whole-company exit listings. A founder lists their company
for sale, acqui-hire, or merger. Inquirers (acquirers, strategic
investors) send a structured inquiry; on accept they get contact details
+ scoped data-room access.

**Primary user.** Founder (Samir persona — actively exiting Probuy);
inquirer is an acquirer or strategic principal.

**Features.**

| Feature | Status | Route | Description |
|---|---|---|---|
| Create exit listing | Shipped (v0.2.0.0) | `/connections/new?type=exit` | Required: `public_summary`. Structured: `ask_type` (Active sale / Open to offers / Acqui-hire / Merger), `ask_amount_sar` (optional), `sector`, `stage`. |
| Browse exit listings | Shipped (v0.2.0.0); co-located with secondaries in `/marketplace` Browse (v1.1) | `/connections?filter=exit` and `/marketplace` | Cross-workspace browse. Magenta `#C73E9D` identity color. |
| Exit listing detail | Shipped | `/connections/[id]` | Public summary, ask details, inquiry CTA for non-owners; owner sees inquiry rows + accept/decline/close actions. |
| Inquiry handshake (one-step accept) | Shipped | `/connections/[id]` and `send_connection_inquiry` / `accept_connection_inquiry` RPCs | sent → accepted (contact reveal + data-room token) → closed. Bidirectional close after accept; owner-only close before. |
| Acquisition (M&A) modelling | Shipped | `/acquisition` | Pre-listing modelling: how the cap table waterfalls under different acquisition prices. |
| Email templates | Shipped | `lib/email/connections.ts` | inquiry-sent, inquiry-accepted-with-contact, inquiry-declined, listing-published. |
| Collision rules | Shipped | RPCs | Open exit ↔ open share_listings (mutually exclusive); open exit ↔ open partnership (mutually exclusive); one open exit per workspace. |

**Data model footprint.** `connection_listings` (with `listing_type='exit'`),
`connection_inquiries`, `data_room_links` (token mint on accept).

**v1.1 changes.** Co-located with Trading Hub on `/marketplace` Browse.
The /connections page remains canonical for exit listing detail and the
inquiry flow; `/marketplace` Browse links into it.

**Open items.**
- **Sharia advisor consult extension (Turky).** Original consult covered
  the secondary marketplace; whole-company exits are a new transaction
  type. **BLOCKING for public launch.**
- **CMA broker-dealer go/no-go (Mahmoud).** Whole-company sale ask may
  require CMA framing clarity. **BLOCKING for exit listing type.**
- **Samir confirmation.** Public named listing for Probuy. **BLOCKING.**
- Anonymous / blind listings — explicit v2.
- DocuSign-style real NDA at data-room access — v2.

### 6.5 Partnership Hub

**Purpose.** Founder partnership matchmaking. Co-founders, advisors,
senior hires, and business partners — discoverable across workspaces.

**Primary user.** Founder (Saif persona — actively seeking partners);
inquirer is a founder, operator, advisor, or senior candidate.

**Features.**

| Feature | Status | Route | Description |
|---|---|---|---|
| Create partnership listing | Shipped (v0.2.0.0) | `/connections/new?type=partnership` | Required: `public_summary`. Structured: `seeking_type` (Co-founder / Advisor / Senior hire / Business partner), `skills[]` (max 10), `equity_expectations` (free text ≤200 chars), `commitment_type` (Full-time / Part-time / Advisory / Flexible). |
| Browse partnership listings | Shipped (v0.2.0.0) | `/connections?filter=partnership` | Cross-workspace browse. Lavender `#8A6FE8` identity color. |
| **Talents** filter (v1.1) | Shipped (v1.1) | `/connections?seeking=senior_hire` | Sidebar entry; filtered partnership browse for `type_data->>'seeking_type' = 'senior_hire'`. |
| **Advisors** filter (v1.1) | Shipped (v1.1) | `/connections?seeking=advisor` | Sidebar entry; filtered partnership browse for advisor. |
| Inquiry handshake | Shipped | Same as Exit Hub | Identical flow — one schema, one RPC family. |
| Email templates | Shipped | Same as Exit Hub | Same four templates work for both listing types. |

**Data model footprint.** `connection_listings` (with
`listing_type='partnership'`), `connection_inquiries`.

**v1.1 changes.** New top-level Talents and Advisors sidebar entries
deep-link into role-scoped partnership filters via the `seeking` query
param (also accepts a `role` alias the sidebar uses).

**Open items.**
- **Promote `seeking_type` to a first-class column on
  `connection_listings`.** Currently filtered via JSONB
  (`type_data->>'seeking_type'`); fine at v1.1 scale but should be a
  column with an index if Talents/Advisors becomes a hot path.
- **Sharia consult — partnership-specific concerns.** Equity expectations
  in partnership listings need explicit clearance. **Same blocker as
  Exit Hub.**
- Algorithmic matching, advisory-marketplace pricing, co-founder
  sub-marketplace separate from partnership — v2.

## 7. Platform Layer

The cross-cutting infrastructure every hub relies on.

### 7.1 Authentication and Identity

- **Sign-in / Sign-up.** Email + password via Supabase auth. Split-layout
  pages (v1.1): dark marketing pane on the leading edge with the
  "Elevating Capital Flow in MENA" headline; auth card on the trailing
  edge with Create Account / Sign In tabs and visual-only social buttons
  (Google / LinkedIn / Apple — stubs until OAuth providers are wired).
- **Magic link / session recovery.** Magic-link signin keys exist; not
  wired to a UI surface.

### 7.2 Internationalisation (EN/AR)

- **28 i18n namespaces** registered in `lib/i18n/I18nProvider.tsx`
  (one per major surface plus shared `common` and `nav`).
- **react-i18next** with synchronous lazy-init so SSR + first paint
  always have a provider; a MutationObserver on `<html lang>` swaps the
  language post-paint when the user toggles.
- **RTL.** Logical properties throughout (`start`/`end`, `ps-`/`pe-`,
  `text-start`); Cairo font for Arabic, Inter for Latin; bilingual aria
  labels on language toggles.

### 7.3 Multi-workspace

- A user can own multiple workspaces (founders running two startups) or
  be a member of others (advisors, employees).
- **Active workspace** stored in the `vp_active_workspace` cookie;
  resolved on the server via `getActiveWorkspace()` with RLS-aware
  fallback to earliest-created accessible workspace.
- **Sidebar (v1.1).** "My Startup" expands to list every workspace the
  user owns or is a member of. The active workspace auto-expands inline
  to show the per-workspace nav (cap table, ESOP, governance, etc.);
  others collapse to a single switch-to row.

### 7.4 Messages — inquiry inbox (v1.1)

- **`/messages`** is a read-only inbox over `connection_inquiries`. Lists
  every inquiry where one of the user's workspaces is on either side.
- Filters: direction (incoming/outgoing) and status (sent/accepted/
  declined/closed).
- Rows link to `/connections/[id]` for the act-on-inquiry surface (the
  inbox is the routing layer, not a second action layer).
- **No on-platform DMs.** Contact reveal is via email post-accept.

### 7.5 Discovery — `/explore`

- Cross-workspace public discovery page. Four sections:
  1. **Companies open to exit** (exit listings)
  2. **Founders, advisors, talent** (partnership listings)
  3. **Shareholders selling equity** (public secondary listings)
  4. **KSA & MENA startups** (published public profiles)
- Guests (unauthenticated) see the companies grid; signed-in users see
  every section.

### 7.6 Data Room (token-based scoped access)

- `data_room_links` rows store signed tokens with TTL (default 14d, max
  90d) and an access tier (intro / standard / diligence).
- On connection-inquiry accept: mint a token, email the inquirer, no
  workspace membership grant.
- Tokens are revocable (`is_active=false`); blast radius capped by TTL.
- PG17-compatible URL-safe base64 token generation (fixed in v0.2.0.0).

### 7.7 Audit trail

- `audit_events` append-only; immutability trigger blocks UPDATE/DELETE
  on covered entity types.
- Covers: `cap_table_mutation`, `share_listing`, `share_listing_rofr`,
  `connection_listing`, `connection_inquiry`, `data_room_link`,
  `governance_event`.

### 7.8 Settings and Profile (v1.1)

- **`/settings`** — account chrome: email (readonly), language + theme
  toggles, "+ new startup" link, sign-out.
- **`/profile`** — user identity: avatar (gradient initials), email,
  owned vs joined workspace stats, per-workspace role rows, user ID
  panel for support.

### 7.9 App shell (v1.1)

- **Sidebar.** Narrow leading rail with icon + label entries:
  Explore · Marketplace · My Startup (expandable) · Round · Messages ·
  Talents · Advisors · Settings · My profile · user pill at bottom.
- **Header.** Sticky translucent bar: hamburger / workspace switcher
  (left), centered global search with ⌘K hint (right of leading group),
  language toggle / theme toggle / notifications popover / avatar
  dropdown (trailing edge).
- **Theme.** `data-theme="dark"|"light"` on `<html>`; tokens defined per
  mode in `globals.css`. Marketing pane on auth pages is locked to dark
  for hero contrast.

### 7.10 Compliance and regulatory framing

- **Sharia.** Reviewed surface-by-surface with Turky. iSAFE green is
  permanent. Connections Hub (exits + partnerships) needs the consult
  extension before public launch.
- **CMA.** Bulletin-board / no-fund-movement framing keeps the platform
  outside broker-dealer scope. Mahmoud's go/no-go required before exit
  listings go live publicly.
- **ZATCA.** Tax handling for off-platform closes is the seller's
  responsibility; we surface capital-gains tax language in the
  marketplace "how closing works" panel.

## 8. Release Plan (Hub-by-Hub Sequencing)

The product is released as five hubs. Today, all five are shipped at
v1.1 in some form, but discoverability gaps remain.

### 8.1 Status Today (2026-05-17)

```
v0.1.0   Startup Hub + Investment Hub + Trading Hub (workspace-internal)
v0.2.0.0 + Exit Hub + Partnership Hub (Connections Hub launch)
v1.1     + Sidebar restructure: hubs as top-level entries
         + /messages inbox (Platform)
         + /settings + /profile (Platform)
         + Marketplace Browse (Trading × Exit co-location)
         + Rounds Browse (Investment cross-workspace)
         + Talents + Advisors (Partnership role filters)
         + Split-layout auth (Platform)
v1.2     + close_financing_round RPC (atomic apply, audit trail)
         + is_public toggle for financing_rounds (Investment publish flow)
         + is_public toggle for share_listings + ROFR gate (Trading publish flow)
         + account_notifications table + 4 triggers + bell wiring (Platform)
         + full-text search (tsvector + GIN + RPC + ⌘K dropdown)
         + investor_update_recipients + per-recipient open tracking + resend-to-unopened
         + transfer-agent cap-table sync on secondary sale
         + acquisition_models + compute_acquisition_model RPC (Exit modelling)
         + seeking_type promoted to first-class indexed column
         + UX hardening: sidebar persistence + workspace switcher reliability
         + Profile completeness (user_profiles: display_name, bio, avatar, location)
         + Settings depth (password + email change real; 2FA + sessions scaffolded;
           date format + timezone; notification prefs; plan/billing surface;
           KSA PDPL data export + account deletion request)
         + Shared UI: word-safe truncation, gradient WorkspaceMark on cards
         + Dilution validation (warn ≥30%, block >50% on publish)
         + Thread view at /messages/[inquiryId] + reply compose
         + Context-aware eyebrow/subtitle per /connections?seeking= variant
         + Equity-terms gating (request-to-view on partnership listings)
```

### 8.2 Near-term (next 4–6 weeks)

The v1.1 P0/P1/P2 backlog is **fully cleared**. See §13 for what shipped.
What's left is a small set of external blockers + a few v1.3-candidate
follow-ups.

**Still BLOCKING — Exit Hub external blockers.** Three calls (Samir,
Turky, Mahmoud). Until cleared, exit listings remain "soft-launched" —
sidebar entry visible, but no founder outreach. See §10.

**v1.3 candidates (next prompt cycle):**

- **Real 2FA + active sessions** in `/settings`. v1.2 ships the cards as
  "Coming soon" scaffolds. Wiring requires Supabase MFA enrollment +
  session-list endpoints.
- **Plan & billing — paid tier.** v1.2 ships a marketing-only "Contact
  us to upgrade" card. Wiring requires a chosen billing rail (Stripe vs.
  HyperPay vs. invoice-only).
- **Notification-preference enforcement.** v1.2 persists per-type
  email/in-app toggles to `user_notification_preferences`; the email
  delivery path in `lib/email/*` still sends regardless. Enforcement is
  a single read per send.
- **DB-level equity-terms split.** v1.2 gates equity terms on partnership
  listings at the UI layer; the JSONB column itself is still cross-
  workspace-readable. Splitting `type_data` into `type_data_public` and
  `type_data_private` columns closes the actual data-level loophole.
- **Account-deletion fulfilment.** v1.2 ships the request-only pattern
  (INSERT into `account_deletion_requests`). The 30-day cron job that
  actually deletes the workspace + user data is not wired.
- **OAuth providers** (Google / LinkedIn / Apple) — buttons exist
  visually since v1.1, still not wired.

### 8.3 v2 candidates (deferred)

Listed in order of probable v2 priority. None of these are committed.

1. **Publish flow UI** (P0 above) is technically v1.2.
2. **Algorithmic matching** for Partnership Hub.
3. **Anonymous / blind listings tier** for Exit Hub (only after
   Samir's named-listing data settles).
4. **In-thread messaging on `/messages`** (currently routing-only).
5. **DocuSign-style real NDA gate** at the diligence tier.
6. **Co-founder sub-marketplace** separate from the partnership listing
   type (only if Saif's data shows co-founder hunts dominate).
7. **Advisory marketplace with pricing.**
8. **Readiness assessment scoring** for exit listings.
9. **Events / demo days.**
10. **Sector / proximity filters on browse** (requires
    `workspace.sector` model expansion).
11. **Multi-shareholder bundle listings** in Trading Hub.
12. **OAuth providers** (Google / LinkedIn / Apple) — buttons exist
    visually, no provider wired.

### 8.4 Kill criteria per hub

| Hub | If by Day 30 post-launch… | Then… |
|---|---|---|
| Exit | No exit listings beyond Samir despite direct outreach | Premise 1 wrong — pause exit listing type. |
| Partnership | No partnership listings beyond Saif despite direct outreach | Premise 1 wrong — pause partnership listing type. |
| Trading | <5 public secondary listings | Browse-tab co-location with Exit is masking the gap — re-evaluate the publish flow UX. |
| Investment cross-workspace | <5 public rounds | Founders don't want public rounds — surface remains workspace-internal. |

The Startup Hub has no kill criteria — it is the substrate the other
hubs depend on.

## 9. Out of Scope (Explicit)

Items the product team should stop receiving requests for, until/unless
the v2 list activates:

- **On-platform fund movement.** No custody, no settlement, no payments.
  Closing happens off-platform with lawyers + registry. This is a Sharia
  and CMA choice, not a feature gap.
- **Anonymous listings (Exit or Partnership).** v1 named-only.
- **NDA tier / click-through NDA gate at data-room access.** Token TTL
  + revocable `is_active` is the v1 model.
- **Two-step inquiry accept.** Owner accept = contact reveal.
- **Monetisation** (listing fees, paywalls, "see who viewed your
  listing", referral revenue). Pre-revenue by design until v2 traction
  data justifies a model.
- **On-platform DMs / chat / threaded messaging.** Email is the channel
  post-accept.
- **Sector / proximity filters on browse.** Requires `workspace.sector`
  data-model expansion.
- **Multi-user listings.** A listing is owned by one workspace; co-
  founders surface via membership on that workspace.
- **Co-founder sub-marketplace separate from Partnership Hub.**
- **Advisory marketplace pricing model.**
- **Readiness assessment scoring.**
- **Events / demo days.**

## 10. Dependencies and External Blockers

| Dependency | Type | Current state | Blocks |
|---|---|---|---|
| **Supabase** (Postgres 17, Auth, RLS, Edge Functions, Resend integration) | Infra | Stable. Project `ezfvurrngphgwppnskus`. | Everything. |
| **Vercel** | Infra | Stable. Production branch: `claude/activate-bypass-permissions-0sjk1`. Live at https://venture-path.vercel.app/ | Everything. |
| **Resend** | Email delivery | Wired. `RESEND_API_KEY` configured. | Inquiry handshake emails, investor updates, ROFR notifications, compliance reminders. |
| **Turky** (Sharia advisor) | Regulatory | Consult extension required for Exit + Partnership Hubs. | Public launch of Exit Hub; nice-to-have for Partnership Hub. |
| **Mahmoud** (CMA contact) | Regulatory | Go/no-go required for Exit Hub. | Public launch of Exit Hub. |
| **Samir** (Probuy founder) | Persona | Confirm acceptance of public named exit listing. | Exit Hub seed. |
| **Saif** | Persona | Continuous follow-up on partnership listings. | Partnership Hub seed. |

## 11. Glossary

| Term | Definition |
|---|---|
| **iSAFE** | VenturePath's Sharia-compliant convertible instrument. Permanent green identity in the design system (`DESIGN.md` §3.6). |
| **Workspace** | The unit of equity ownership. One workspace = one company = one cap table. |
| **Public profile** | A workspace with `public_profile_published=true` and a `slug` — discoverable on `/explore`. |
| **Exit listing** | A `connection_listings` row with `listing_type='exit'`. Whole-company sale, acqui-hire, or merger. |
| **Partnership listing** | A `connection_listings` row with `listing_type='partnership'`. Co-founder / advisor / senior hire / business partner. |
| **Secondary listing** | A `share_listings` row. An existing shareholder posting part of their equity for sale. |
| **Open round** | A `financing_rounds` row with `status='open'` and `is_public=true`. Discoverable on `/rounds` Browse and `/explore`. |
| **ROFR** | Right of first refusal. On a new secondary listing, existing shareholders are notified and can exercise or decline before the listing opens to others. |
| **Data room token** | A signed time-limited link granting scoped read access to a workspace's vault, without granting workspace membership. |
| **Off-platform closing** | Every transaction (round close, secondary sale, exit sale) is executed off-platform via lawyers + registry. VenturePath provides the structured-data layer and the contact reveal; it never holds funds. |
| **Inquiry** | A `connection_inquiries` row. Structured "I'm interested in this listing" message with one-step owner accept. |

## 12. Open Questions for the Product Team

1. **Talents vs Advisors split.** Should we promote `partnership_role`
   to a first-class column now (P2 on §8.2) or wait for usage data? The
   current JSONB filter works at scale ~10k listings.
2. **Marketplace + Exit co-location.** v1.1 puts both on `/marketplace`
   Browse. Should the Exit Hub get its own top-level sidebar entry
   instead (`/exits`)? Trade-off: co-location reduces tab-switching for
   buyers; separation makes hub-level positioning cleaner for founders.
3. **Messages future.** Read-only routing surface vs full in-thread
   messaging. v1 + v1.1 went read-only deliberately (off-platform
   contact via email is the principle). Should v2 reverse this?
4. **Compliance scope.** Today we track ZATCA, GAZT, MOC obligations.
   Should we add Hijri-calendar-aware obligations (Zakat dates)?
5. **Investor view.** A logged-in investor today sees the same UI as a
   founder. Should Investment Hub get an investor-specific landing
   that aggregates "rounds I've invested in" across workspaces?

---

## 13. v1.2 — Cross-workspace Activation + UX Hardening (2026-05-17)

v1.2 is two passes stacked: an **activation pass** that closes the
end-to-end loops that v1.1 left half-wired (publish flows, notification
aggregation, search, M&A modeller persistence, transfer-agent), and a
**UX hardening pass** that walked the 20 items from a third-party UX/QA
audit through 6 commit batches.

Each subsection lists **Features delivered**, **Requirements satisfied**,
and **User stories**. Requirement IDs use the same `REQ-<hub>-<n>` scheme
as the original prompt brief.

### 13.1 Investment Hub — atomic round-close

**Features delivered:**
- `close_financing_round(p_round_id, p_pre_money, p_fd_shares,
  p_actual_raise, p_close_date, p_promotions JSONB, p_conversions
  JSONB)` SQL RPC.
- Migration `20260517120000_close_financing_round_rpc.sql`. Promotes
  signed term-sheet investors to ordinary shareholders, converts
  iSAFE/SAFE/CN holders to ordinary using a TS-supplied conversion plan
  (math stays in `lib/cap-table/isafe-math.ts` for Sharia review), marks
  originals as `conversion_status='converted'`, closes the round atomically
  in one transaction.
- `financing_round` added to the `audit_events.entity_type` CHECK and the
  marketplace immutability trigger. Per-conversion audit rows
  (`entity_type='shareholder'`) stay mutable; the round-close audit row
  (`entity_type='financing_round'`) is tamper-proof.
- 15-case pgTAP suite at `supabase/tests/close_financing_round.sql`;
  equivalent BEGIN/ROLLBACK harness verified 15/15 against live DB.
- `app/(app)/rounds/actions.ts:closeRound` refactored from N+M
  sequential Supabase calls to a phase-1-compute / phase-2-apply
  pattern. The TS phase still owns the math.

**Requirements satisfied:** PRD invariant §5.4 row 4 ("Closing a Round
auto-converts iSAFE/SAFE/CN to ordinary shares; cap table updates
atomically"). v1.1 satisfied the math but not the atomicity. v1.2
closes the gap.

**User stories:**
- *As a founder closing a round*, I want the cap-table update to either
  fully succeed or fully fail, so that a mid-flight network failure can't
  leave half my investors as ordinary and half as iSAFE.
- *As an auditor reviewing a regulated event*, I want the round-close
  audit row to be immutable so that nobody can rewrite history after a
  dispute.

### 13.2 Investment Hub — is_public toggle for financing rounds (REQ-INV-02)

**Features delivered:**
- Toggle on the round-creation wizard (last field) — "Make this round
  discoverable to other investors on VenturePath".
- Toggle on the round-management view (`/rounds/[id]`) — pre-populated
  from current state, fires `setRoundVisibility` immediately on change,
  optimistic with rollback.
- Audit shape upgraded from `entity_type='workspace'` to
  `'financing_round'` with payload `{ from: bool, to: bool }`.
- `/rounds` Browse empty-state CTA — if the user has a private open
  round in their workspace, show "You have an open round. Make it
  discoverable →" linking to that round.
- EN + AR i18n keys (`visibility.toggle.*`, `browse.empty.*_v2`,
  `browse.empty.cta_with_round`).

**Requirements satisfied:**
- REQ-INV-02 (v1.1 P0): close the discoverability gap on financing
  rounds. The `is_public` column existed since `20260515180000`; v1.2
  finally exposed it in the UI.
- §4 product principle #5 (opt-in cross-workspace visibility) — the
  toggle is the opt-in.

**User stories:**
- *As a founder mid-raise*, I want to flip my round to "discoverable"
  with one click so other VenturePath investors can find me.
- *As an investor browsing /rounds*, I want to see open rounds across
  every founder who opted in, not just my own workspace's rounds.
- *As a founder with a private round in draft*, I want a one-click path
  from the empty Browse tab back to my own round settings so I can
  publish it.

### 13.3 Trading Hub — is_public toggle for share listings (REQ-TRADE-01)

**Features delivered:**
- Toggle on the share-listing creation form — "Make this listing visible
  to all VenturePath members".
- Toggle on the listing-management view (`/marketplace/[id]`) with a
  **ROFR gate**: if any `rofr_notifications` row for this listing has
  `response IS NULL AND window_expires_at > now()`, the toggle is
  disabled with a tooltip: "ROFR window closes on {date}. You can make
  this listing public after that."
- `setListingVisibility(listingId, isPublic)` server action enforces
  the ROFR gate server-side too (defense in depth).
- Audit row uses `entity_type='share_listing'` with the same
  `{from, to}` payload pattern.
- `/marketplace` Browse empty-state CTA — same pattern as Rounds.

**Requirements satisfied:**
- REQ-TRADE-01: close the discoverability gap on share listings.
- PRD §6.3 invariant: ROFR window must clear before a listing can go
  public — otherwise the ROFR right is bypassed.

**User stories:**
- *As an existing shareholder*, I want to control whether my listing is
  visible only to other workspace owners or to every signed-in user.
- *As a shareholder with an active ROFR window*, I want the toggle to
  refuse "public" until my co-shareholders have had their chance to
  exercise — otherwise the ROFR mechanism is theatre.
- *As a buyer*, I want the `/marketplace` Browse tab to show real
  listings, not just workspace-internal ones.

### 13.4 Platform — account_notifications + bell wiring (REQ-PLAT-01)

**Features delivered:**
- `account_notifications` table (migration `20260518000000`) with
  `type` CHECK enum across 7 categories: `inquiry_received`,
  `inquiry_accepted`, `inquiry_declined`, `rofr_notified`,
  `investor_update_opened`, `compliance_overdue`,
  `round_visibility_changed`.
- Own-rows-only RLS (SELECT + UPDATE). Writes are trigger-only via
  `SECURITY DEFINER`.
- Four SQL triggers populate notifications from existing tables:
  `connection_inquiries` (sent + accepted + declined),
  `rofr_notifications` (insert), `investor_update_views` (insert).
- `GET /api/notifications` returns `{ unread_count, notifications }`
  (last 20, newest first); `PATCH /api/notifications {action:'read_all'}`
  marks all unread.
- Header bell (`app/(app)/components/notifications-button.tsx`)
  rewritten from a visual stub to a fully wired component: 60s poll,
  unread badge, per-type SVG icon, relative time, "Mark all as read",
  empty state, click-through to `notification.url`.
- i18n title override: bell prefers `nav.notifications.title.<type>`
  i18n keys over the DB-stored English fallback, so Arabic UI shows
  Arabic titles.
- 7-case BEGIN/ROLLBACK smoke harness verified 7/7 against live DB +
  pgTAP suite at `supabase/tests/account_notifications.sql`.

**Requirements satisfied:**
- REQ-PLAT-01: aggregate trigger events into a user-facing feed.

**User stories:**
- *As a listing owner*, I want a bell badge when someone inquires on my
  exit/partnership listing so I don't have to refresh the listing detail
  page.
- *As an inquirer*, I want to know the moment my inquiry is accepted or
  declined.
- *As a shareholder receiving a ROFR notification*, I want it surfaced
  in the bell as well as the email so I don't miss the window.
- *As a founder running an investor update*, I want a notification when
  an investor opens it.

### 13.5 Platform — full-text search (REQ-PLAT-02)

**Features delivered:**
- Migration `20260519000000_full_text_search.sql` adds STORED
  `tsvector` columns on `workspaces`, `connection_listings`, and
  `financing_rounds`, with three GIN indexes.
- Each tsvector mixes English + simple analyzers — the simple analyzer
  provides minimal Arabic content coverage without installing a
  language-specific stemmer.
- `search_platform(p_query TEXT) RETURNS JSON` RPC: UNION ALL across the
  three sources, ranked by `ts_rank`, limited to 20 results.
- `GET /api/search?q=…` 400 if `q < 2` chars, calls the RPC, 401 if
  unauthenticated.
- `app/(app)/components/search-bar.tsx` rewritten from a static stub
  to a client combobox: 300ms debounce, spinner, grouped results
  (Companies / Listings / Rounds), inline stroke-SVG icons, keyboard
  navigation, ⌘K global shortcut, ARIA-combobox attributes.
- 5/5 BEGIN/ROLLBACK smoke cases (falafel → workspace; payments cto →
  partnership listing; sukna → financing round; 1-char → empty array;
  unmatched → empty array).

**Requirements satisfied:**
- REQ-PLAT-02: wire the ⌘K command palette in the header to a real
  search backend.

**User stories:**
- *As a user looking for a specific company*, I want to type its name
  and hit Enter to navigate there, instead of scrolling /explore.
- *As an investor browsing for KSA payments fintechs*, I want a search
  query that spans listing summaries, not just workspace names.
- *As a power user*, I want a ⌘K shortcut so I never have to click into
  the search box.

### 13.6 Investment Hub — investor-update recipient tracking (REQ-INV-03)

**Features delivered:**
- Migration `20260519100000_investor_update_recipients.sql` adds the
  table with `email`, `name`, `sent_at`, `opened_at`,
  `resend_message_id`; unique on `(update_id, email)` so re-sends upsert.
- RLS: workspace-member SELECT via `user_can_access_workspace(iu.workspace_id)`.
- `publishInvestorUpdate` server action refactored from a batch send
  to per-recipient sends so each email gets a unique `?r=<encoded-email>`
  URL and a captured `resend_message_id`. Rows are upserted after the
  Resend API call.
- `record_investor_update_view` RPC gains a `p_email TEXT DEFAULT NULL`
  parameter; when the view URL carries `?r=`, the recipient's
  `opened_at` is stamped (NULL-guarded so re-opens don't overwrite).
- Existing `investor_update_views` table is **kept** for anonymous view
  count.
- `RecipientsSection` client component on `/investor-updates/[id]`
  shows a table (Name / Email / Sent / Opened / Status badge) with a
  "Re-send to unopened" button enabled only when at least one recipient
  has `opened_at IS NULL`.
- `resendToUnopenedRecipients` server action drives the re-send.

**Requirements satisfied:**
- REQ-INV-03: per-person open-rate tracking; re-send capability.

**User stories:**
- *As a founder sending an update to 30 investors*, I want to see who
  opened it and re-send only to the ones who didn't, instead of nagging
  the whole list.
- *As an investor receiving the same update twice*, I want the second
  send to update the existing recipient row, not create a duplicate.

### 13.7 Trading Hub — transfer-agent cap-table sync (REQ-TRADE-02)

**Features delivered:**
- Migration `20260519200000_transfer_agent_cap_table_sync.sql` replaces
  `mark_share_listing_sold_off_platform` with an overloaded version:
  `(p_listing_id, p_buyer_name?, p_buyer_email?, p_sale_price_sar?)`.
- When buyer details are provided, the RPC atomically: decrements the
  seller's `instrument_data->>'shares'`, soft-deletes the seller row if
  shares hit zero, inserts a new buyer shareholder row with
  `acquired_via='secondary_sale'` and a back-reference to the listing,
  writes a `cap_table_mutation` audit row (`entity_type='shareholder'`).
- Backward-compatible: if buyer fields are blank, the listing flips to
  `sold_off_platform` with no cap-table change (the v1 behavior).
- UI form in `app/(app)/marketplace/[id]/listing-actions.tsx` adds
  three optional inputs + a confirmation step: "This will update your
  cap table and cannot be undone."
- 6/6 BEGIN/ROLLBACK smoke cases (no-buyer no-op, partial sell-down,
  full sell-down soft-deletes seller, non-owner rejected, already-sold
  rejected, under-shared seller rejected).

**Requirements satisfied:**
- REQ-TRADE-02: secondary sale must keep the cap table in sync,
  otherwise the "verified-data moat" claim breaks the moment a sale
  closes off-platform.

**User stories:**
- *As a founder approving a secondary sale*, I want the cap table to
  update automatically when I mark the listing sold, so the buyer
  appears as a shareholder and the seller's share count drops.
- *As a buyer*, I want to appear on the cap table with a price-per-share
  derived from the actual sale price, not the seller's original
  purchase price.

### 13.8 Exit Hub — M&A modelling RPC (REQ-EXIT-01)

**Features delivered:**
- Two new tables: `acquisition_models` and `acquisition_model_results`
  (migration `20260519300000`). RLS: workspace-member full access on
  models; SELECT on results.
- `compute_acquisition_model(p_workspace_id, p_acquisition_price_sar,
  p_debt_sar, p_label, p_connection_listing_id) RETURNS JSON` RPC.
  Computes per-shareholder payouts using a fully-diluted pro-rata model
  (1× non-participating preference is documented as a v1.3 candidate).
- 5-model-per-workspace cap (enforced inside the RPC); raises with a
  clear "archive a model" message when exceeded.
- `archive_acquisition_model(p_model_id)` soft-deletes a model to free
  up a slot.
- `/acquisition` page rewritten: lists saved scenarios as cards,
  "+ New scenario" form (label + price + debt + optional exit-listing
  attach), results table (Shareholder / Shares / Payout / Multiple)
  sorted by payout DESC.
- 4/4 BEGIN/ROLLBACK smoke cases + 14 pgTAP assertions at
  `supabase/tests/acquisition_models.sql`.

**Requirements satisfied:**
- REQ-EXIT-01: persist M&A scenarios server-side; replace client-only
  math; surface saved scenarios across sessions.

**User stories:**
- *As a founder considering an exit*, I want to model multiple
  acquisition prices and save the scenarios, not redo the math every
  time I open the page.
- *As a founder with an open exit listing*, I want to attach an M&A
  model to that listing so future inquirers can see the seller's
  modelled outcome at the asking price.

### 13.9 Partnership Hub — seeking_type column promotion (REQ-PART-01)

**Features delivered:**
- Migration `20260519400000_seeking_type_column.sql` adds a first-class
  `seeking_type TEXT` column with a CHECK constraint, backfills it from
  `type_data->>'seeking_type'` for existing partnership listings,
  creates a partial index `(seeking_type, status, listed_at DESC) WHERE
  deleted_at IS NULL AND listing_type = 'partnership' AND seeking_type
  IS NOT NULL`.
- `create_connection_listing` RPC extracts and validates `seeking_type`
  on insert for partnership listings.
- `/connections` browse query swapped from `eq("type_data->>seeking_type", ...)`
  (sequential JSONB scan) to `eq("seeking_type", ...)` (indexed).
- Backward-compatible: `type_data` JSONB still carries the field; no
  consumer code needs to migrate.

**Requirements satisfied:**
- REQ-PART-01 (v1.1 §8.2 P2): index the Talents/Advisors filter path.

**User stories:**
- *As the platform*, I want the Talents and Advisors filters to scale
  past JSONB sequential scans as listings grow.
- *As a developer*, I want the column promotion to be transparent so I
  don't have to dual-read JSONB + column.

### 13.10 UX hardening — Batch A (sidebar + profile) [audit items #1, #8, #9, #15, #20]

**Features delivered:**
- **Workspace switcher reliability** — `switchWorkspace` server action
  now accepts an optional `redirectTo: string`; the sidebar passes
  `usePathname()` so the user lands back on the same logical page after
  switching, not `/dashboard`. Click guard prevents double-fires while a
  transition is pending.
- **Sidebar expansion persistence** — `MyStartups` and `NestedNavGroups`
  expansion state is mirrored to `localStorage` keyed
  `venturepath-sidebar-expanded`; reads on mount, writes on toggle. SSR
  initial state is `{}` (all collapsed) to avoid hydration mismatch.
- **`user_profiles` table** (migration `20260520000000`) — keyed by
  `user_id`, columns: `display_name`, `bio` (≤500 chars), `avatar_url`,
  `linkedin_url`, `location`. RLS: own SELECT + UPSERT; cross-workspace
  read by any authenticated user (v2 will surface this on /explore).
- **Profile page** reads the new table, shows display_name + avatar +
  bio + tier badge + member-since.
- **`/profile/edit`** — edit form with bio counter, avatar URL paste
  (no file upload yet), LinkedIn URL, location.
- **"View →" buttons** on /profile and /settings workspace lists now use
  `switchWorkspaceAndGo(workspaceId, '/company')` instead of a plain
  link, so the user lands on the right workspace's company info.
- Profile page's CSS width bug (max-w-3xl not applied) fixed.

**Requirements satisfied:**
- Audit items #1 (workspace switcher), #8 (profile CSS bug), #9 (profile
  completeness), #15 (per-workspace View routing), #20 (sidebar state
  persistence).

**User stories:**
- *As a user with multiple workspaces*, I want to switch from Workspace
  A to Workspace B without losing my place on `/rounds` or `/cap-table`.
- *As a user with the Equity sub-group expanded*, I want it to stay
  expanded when I navigate.
- *As an operator visiting another founder's profile*, I want to see
  their name and LinkedIn — not just an email and a UUID.
- *As a user with two workspaces*, I want "View →" next to Workspace B
  on /profile to actually take me to Workspace B's company page, not
  Workspace A's.

### 13.11 UX hardening — Batch B (settings depth) [audit items #5, #6, #13, #18, #19]

**Features delivered:**
- **Real password change** via `supabase.auth.updateUser({password})`.
- **Real email change** via `supabase.auth.updateUser({email})` — sends
  verification email, surface shows "verification sent" state.
- **2FA + active sessions** — shipped as "Coming soon" scaffolds with
  clear placeholder copy. Wiring is a v1.3 P0.
- **Data export** — full JSON dump of 10 data sources keyed by user_id
  + owned workspaces. Real download via `application/json` blob.
- **Account deletion request** — `account_deletion_requests` table
  (INSERT + SELECT-only RLS, no UPDATE/DELETE policy). 30-day-copy
  pattern: "Your account will be deleted within 30 days of this
  request." The 30-day cron is a v1.3 P0.
- **Date format + timezone preferences** — persisted to `user_profiles`.
  3 date formats (ISO / US / EU); 13 common timezones via dropdown.
  Helper at `lib/date/format.ts` reads the preference. 8 vitest tests.
- **Notification preferences** — new `user_notification_preferences`
  table with composite PK `(user_id, notification_type)` and email +
  in-app toggles per type. Row-level UPSERT on toggle. Enforcement in
  email delivery is documented as v1.3.
- **Plan & billing surface** — FREE-tier card with feature list +
  "Contact us to upgrade" CTA (mailto). No real billing rail yet.
- **Privacy & data section** — KSA PDPL language + "Download my data" +
  "Delete my account" CTAs.

**Requirements satisfied:**
- Audit items #5 (security depth), #6 (PDPL data export + deletion),
  #13 (date + timezone preferences), #18 (plan/billing surface),
  #19 (notification preferences).

**User stories:**
- *As a user concerned about KSA PDPL*, I want to download all my data
  in a structured format on demand.
- *As a user leaving the product*, I want a deletion request flow that
  doesn't immediately destroy data so I have a 30-day window to change
  my mind.
- *As a user in KSA*, I want dates rendered as `17/05/2026` (DD/MM/YYYY)
  not `5/17/2026` (US), with a one-click preference.
- *As a user receiving 5 emails a day*, I want to mute specific
  notification categories without unsubscribing entirely.

### 13.12 UX hardening — Batch C (shared UI hygiene) [audit items #2, #16, #17]

**Features delivered:**
- **Word-safe truncation helper** at `lib/text/truncate.ts`:
  `truncateWords(input, maxChars)` returns the longest word-bounded
  prefix with an ellipsis; falls back to hard-cut + ellipsis if the
  first word exceeds the window. 9 vitest tests.
- Applied at message-snippet, listing-summary, and audit-row
  description render sites — replaces both CSS `line-clamp` clipping
  and ad-hoc `.slice(0, N)`.
- **Gradient WorkspaceMark** at
  `app/(app)/components/workspace-mark.tsx` — shared
  `from-(--color-gradient-start) to-(--color-gradient-end)` square
  rendered as the workspace's first initial. Wired on rounds browse
  cards, marketplace browse cards (secondaries + exits), connections
  browse cards, and messages inbox rows.
- **Audit-timestamp verification** — the audit's "all 12 events same
  timestamp" finding was investigated and confirmed to be a demo-seed
  artifact, not a product bug. A positive-control INSERT got its own
  `created_at`. The `DEFAULT NOW()` is correct.

**Requirements satisfied:**
- Audit items #2 (verified, no fix needed), #16 (card avatars),
  #17 (truncation).

**User stories:**
- *As a reader*, I want long card snippets to truncate at word
  boundaries, not in the middle of "disc[overy]".
- *As a reader scanning a feed of workspaces*, I want a visual mark per
  card (initials gradient) so I can pattern-match faster than reading
  every workspace name.

### 13.13 UX hardening — Batch D (rounds + marketplace) [audit items #3, #11, #14]

**Features delivered:**
- **Dilution validation** — new `lib/cap-table/implied-dilution.ts`:
  `impliedDilutionPct(target_raise, pre_money)` + `dilutionVerdict()`
  classifier returning `ok | warn (≥30%) | block (>50%)`. 17 vitest
  tests.
- Warn banner on the round-creation form when verdict ≥ `warn`.
- Block banner + submit-button disabled when verdict = `block`.
- `setRoundVisibility` server action additionally refuses
  `is_public=true` when verdict is `block` (defense in depth).
- Same warn-only banner on `/dilution` for what-if modelling.
- **Exclude-own from cross-workspace discovery** — `/rounds`,
  `/marketplace`, and `/connections` Browse tabs filter out the user's
  own workspaces via `.not("workspace_id", "in", "(…)")`. Discovery
  feeds no longer surface the user's own listings/rounds back at them.
- **Filter pill counts** — every tab and filter chip across
  `/rounds`, `/marketplace`, `/connections` shows a tabular-nums count
  badge. Parallel count queries via `Promise.all`.

**Requirements satisfied:**
- Audit items #3 (dilution validation), #11 (exclude own from
  discovery), #14 (counts everywhere).

**User stories:**
- *As a founder publishing a round*, I want a warning when the implied
  single-round dilution is >30%, and a hard block when >50%. These are
  almost always typos (off-by-10× pre-money).
- *As a user on /rounds*, I want the "Open rounds" tab to show OTHER
  companies' rounds, not my own — the whole point of the tab is
  discovery.
- *As a user scanning filter chips*, I want to know each chip's
  count before clicking, so I can choose where to invest attention.

### 13.14 UX hardening — Batch E (messages + connections) [audit items #4, #7, #12]

**Features delivered:**
- **`connection_inquiry_messages` table** (migration `20260520300000`).
  Either-party read RLS scoped to the inquiry; insert restricted to
  non-closed inquiries.
- **Thread view** at `/messages/[inquiryId]` (NEW route). Header shows
  inquiry status + counterparty + listing context; message bubbles
  styled per sender; reply textarea at bottom (max 2000 chars, with
  counter). Disabled on closed/declined inquiries with a hint.
- **`sendInquiryMessage(inquiryId, body)` server action**.
- **`/messages` inbox row** now links to `/messages/[id]` (thread)
  instead of `/connections/[listingId]` (listing detail). A secondary
  "View listing →" link inside each row preserves the listing-action
  path. /connections/[id] gains a "View thread →" link next to each
  inquiry. Action surface and conversation surface are now
  complementary, not competing.
- **Context-aware copy** on `/connections?seeking=…`. Eyebrow is no
  longer the generic "INVESTMENT" — it switches to "Talents",
  "Advisors", "Co-founders", or "Business partners" depending on
  `seeking`. Subtitle swaps to a variant-specific line.
- New i18n keys: `messages.thread.*`, `connections.header.eyebrow.*`,
  `connections.header.subtitle.*` in EN + AR.

**Requirements satisfied:**
- Audit items #4 (data-model separation — addressed by adding a real
  thread surface at a distinct URL space, NOT by regressing the
  v1.1 design where /connections/[id] is the canonical action surface),
  #7 (reply/compose), #12 (context-aware seeking-variant copy).

**User stories:**
- *As an inquirer who got an acceptance*, I want to reply in-product to
  ask follow-up questions, instead of bouncing to email.
- *As a listing owner browsing my inbox*, I want to read full message
  threads in /messages, not jump to /connections/[id] every time.
- *As a user clicking the "Talents" sidebar item*, I want the page
  header to say "Talents" — not the generic "Connections" or worse,
  "Investment".

### 13.15 UX hardening — Batch F (equity-terms gating) [audit item #10]

**Features delivered:**
- **EquityGate card** at `app/(app)/connections/[id]/equity-gate.tsx`
  — lock-icon card replacing the inline equity-expectations text on
  partnership listing details when the viewer is not authorised.
- **Authorisation rule:** `canSeeEquityTerms = isOwner ||
  (myInquiry?.status === 'accepted')`. Owner always sees it; viewers
  see it only after the listing owner has accepted their inquiry.
- **Pending state:** "Your inquiry is pending — terms will reveal once
  accepted."
- **Action:** "Request equity terms" button fires the existing
  `send_connection_inquiry` RPC.
- UI-only gate; the underlying `type_data` JSONB column is still
  cross-workspace-readable at the DB level. Splitting into
  `type_data_public` + `type_data_private` columns is a v1.3
  candidate (see §8.2).
- `gating_hint` paragraph added to the partnership listing creation
  form so listers understand that equity terms are gated by default.

**Requirements satisfied:**
- Audit item #10 (compensation/equity terms publicly leaked).

**User stories:**
- *As a founder posting an advisor listing*, I want my "0.25-0.5%
  advisor equity, 2y vest" line gated behind "request to view" so it's
  not broadcast to every signed-in user.
- *As an inquirer*, I want a one-tap "Request equity terms" button that
  uses the same inquiry mechanism as anything else on the listing.

### 13.16 Test coverage

The v1.2 batch shipped 34 new vitest tests (8 date-format, 9 truncate,
17 dilution) bringing the baseline from 123 → 157 passing. Test counts
verified at every commit; no regressions.

DB-side test coverage is split between pgTAP files (for the
canonical `supabase test db` workflow, not yet wired against the live
project) and BEGIN/ROLLBACK smoke harnesses run via the Supabase MCP
during each prompt. Live-DB pass counts:

- close_financing_round: 15/15
- account_notifications: 7/7
- full_text_search: 5/5
- transfer_agent_cap_table_sync: 6/6
- acquisition_models: 4/4
- seeking_type promotion: backfill count parity verified (6/6 partnership
  rows backfilled)
- inquiry_messages: 3/3 (RLS read both-parties, write closed-inquiry
  rejection, cross-party write rejection)

### 13.17 What did NOT ship in v1.2 (intentionally deferred)

- **Real 2FA enrolment + active session list** — UI scaffolds in
  /settings, no Supabase MFA wiring. v1.3 P0.
- **Notification-preference enforcement in email** — table exists, send
  path doesn't read it yet. v1.3 P0.
- **DB-level equity-terms column split** — gating is UI-only; the
  `type_data` JSONB column is still cross-workspace-readable. Splitting
  closes the actual data-level leak. v1.3 P1.
- **Account-deletion fulfilment cron** — request-only pattern shipped;
  no scheduled job actually deletes data after 30 days. v1.3 P0.
- **Search across investor updates, term sheets, and audit events** —
  v1.2 covers workspaces + connection_listings + financing_rounds. The
  other tables can be added with one `setweight` block each. v1.3 P2.
- **Sender-side notification trigger on inquiry-message insert** — the
  thread view ships without a notification when a reply arrives. v1.3 P1.
- **Audit-events expansion for the new entity types** — `account_deletion_request`,
  `acquisition_model`, `connection_inquiry_message` are not in the
  CHECK constraint yet. v1.3 cleanup.
- **OAuth providers** (Google / LinkedIn / Apple) — buttons visible
  since v1.1, no provider wired. v1.3 P2.

These deferrals are flagged in `TODOS.md` and the commits' descriptions.
