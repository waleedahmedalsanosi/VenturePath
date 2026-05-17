# PRD: VenturePath

**Version:** 1.0 (product-wide)
**Status:** v0.2.0.0 shipped; v1.1 surface restructure shipped 2026-05-16
**Owner:** Waleed Alsanosi
**Repo:** waleedahmedalsanosi/VenturePath
**Audience:** Product team — for hub-level scope and release sequencing.
**Companion docs:**
- `docs/prd-connections-hub.md` — deep-dive on the Exit + Partnership Hubs (data model, RLS, inquiry handshake)
- `DESIGN.md` — Kinetic Sovereign design system (papyrus + teal gradient, bilingual EN/AR + RTL)
- `CHANGELOG.md` — versioned release history
- `TODOS.md` — external blockers and deferred work

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
| **Startup Hub** | The workspace itself: company identity, team, governance, compliance, traction, vault. | Shipped (v0.1.0) |
| **Investment Hub** | End-to-end fundraising: cap table, instruments, rounds, term sheets, investor updates, modelling. | Shipped (v0.1.0) |
| **Trading Hub** | Secondary share marketplace: existing shareholders posting their equity for sale. | Shipped (v0.1.0); cross-workspace browse added v1.1 |
| **Exit Hub** | Whole-company exits: founders listing their company for sale, acquisition, or merger. | Shipped (v0.2.0.0); cross-workspace browse v1.1 |
| **Partnership Hub** | Founder partnerships: co-founders, advisors, senior hires, business partners. | Shipped (v0.2.0.0); Talents/Advisors role filter v1.1 |

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

### 8.1 Status Today (2026-05-16)

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
```

### 8.2 Near-term (next 4–6 weeks)

**P0 — discoverability gap closure (Publish PRD).** No hub-level surface
is gated on this except cross-workspace browse, but Browse tabs are
empty until founders/shareholders can flip `is_public` from inside the
app. Scope:

- Toggle on the round-management form for `financing_rounds.is_public`.
- Toggle on the listing-management form for `share_listings.is_public`.
- Empty-state copy on Browse tabs nudging the user to flip their own
  flag if they have listings/rounds.

**P0 — Exit Hub external blockers.** Three calls (Samir, Turky, Mahmoud).
Until cleared, exit listings remain "soft-launched" — sidebar entry
visible, but no founder outreach.

**P1 — Sidebar polish.**
- Distinguish co-founder and business-partner from the
  Talents/Advisors split (or accept that Talents covers them via the
  full Partnership filter).
- Wire Search (currently visual only) to a Supabase full-text query
  spanning company names, listing summaries, and round names.
- Wire Notifications (currently empty popover) to an
  `account_notifications` table that aggregates: new inquiry on your
  listing, new ROFR notification on a share you hold, your investor
  update was opened, your compliance obligation is overdue.

**P2 — Schema column for `partnership_role`.** Promote
`type_data->>'seeking_type'` to a first-class indexed column on
`connection_listings`. Migration only; UI unchanged.

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
