# PRD: Connections Hub

**Version:** 1.2
**Status:** Shipped (v0.2.0.0, 2026-05-16; v1.1 navigation + inbox updates 2026-05-16; v1.2 thread view + seeking column + equity gating 2026-05-17)
**Owner:** Waleed Alsanosi
**Repo:** waleedahmedalsanosi/VenturePath
**Related artifacts:**
- Design doc: `~/.gstack/projects/waleedahmedalsanosi-VenturePath/root-claude_activate-bypass-permissions-0sjk1-design-20260516-081800.md`
- Design system updates: `DESIGN.md` §3.6, §8, §12
- Migrations: `supabase/migrations/20260516000004_connections_hub.sql` through `20260520300000_inquiry_messages.sql`
- PR: https://github.com/waleedahmedalsanosi/VenturePath/pull/1

### Changelog

- **v1.2 (2026-05-17):** Closed three v1.1 deferred items + added one
  brand-new surface. (a) `seeking_type` promoted to a first-class indexed
  column on `connection_listings` (Talents/Advisors filter now uses a
  real index, not a JSONB sequential scan); (b) a reply-capable thread
  view shipped at `/messages/[inquiryId]` so `/messages` is no longer
  read-only; (c) equity-terms gating on partnership listings — the
  `equity_expectations` line is hidden behind a "Request equity terms"
  card unless the viewer is the owner or has an accepted inquiry;
  (d) context-aware eyebrow + subtitle per `/connections?seeking=`
  variant so Talents and Advisors no longer share the generic
  "INVESTMENT" eyebrow. See §19 for the full delta and the supersedes
  notes on §18.5's deferral list.
- **v1.1 (2026-05-16):** Surface restructure to match the redesigned
  shell. New top-level navigation, dedicated `/messages` inquiry inbox,
  role-scoped partnership entry points. See §18 and supersedes notes
  on Decisions #10 and #13.

---

## 1. Problem Statement

KSA founders have no trusted, structured place to:

a. List their company for exit (active sale / acqui-hire / merger), or
b. Find co-founders, advisors, senior hires, or business partners.

Current workarounds — brokers + WhatsApp for exits, LinkedIn / Telegram founder
groups for partnerships — are:

- **Slow.** Brokers take weeks to surface a single candidate.
- **Opaque.** No structured profile, no signal filter, no follow-up workflow.
- **Expensive.** Broker fees (2–5% of deal value) for what is effectively
  intermediation that the platform can automate.
- **Noisy.** LinkedIn DMs and Telegram groups produce 80% noise.

The structural insight from office-hours: Samir (wants to exit Probuy) and Saif
(wants partnerships) are **two sides of the same marketplace, not customers of
two different products.** A founder seeking a buyer and a founder seeking a
co-founder share ~80% of the underlying data model: workspace identity, what
they're seeking, structured fields, staged disclosure, contact handshake.

## 2. Demand Evidence

Two specific founders, both following up unprompted (the strongest demand
signal):

- **Samir, Probuy.** Actively wants to exit. Currently paying broker fees
  + running deal conversations over WhatsApp.
- **Saif.** Actively wants partnership / co-founder / business partnership
  matching. Currently posting in LinkedIn and Telegram founder groups and
  manually filtering noise.

Pattern: "upset if it disappeared / asks when it ships," not "interested in
seeing it." Both asked the founder directly to build this.

## 3. Goals and Non-Goals

### Goals

1. Give Samir a path to list Probuy for exit and surface inquiries from
   credible, vetted users (other VenturePath workspace owners) within 7 days
   of ship.
2. Give Saif a path to post a partnership listing and receive inquiries from
   founders looking for the same kind of connection within 7 days of ship.
3. Provide a **trust moat** that AngelList and Acquire.com cannot match:
   verified cap-table data, audited financials, structured round history
   already on platform.
4. Stay Sharia-compliant and CMA-compliant. No fund movement on platform;
   off-platform closing only.
5. Be bilingual (Arabic / RTL) and KSA-first.

### Non-Goals (out of v1)

- **Algorithmic matching.** Browse + filter + manual "I'm interested" only.
- **Anonymous / blind listings.** Named-only in v1 (anonymization is
  impossible for Probuy given sector + KSA market size; weak anonymization
  is worse than no anonymization).
- **NDA tier / click-through NDA gate.** Removed when named-only was decided.
- **Two-step inquiry accept.** Owner accept is the only required step.
- **Monetization** (listing fees, paywalls, "see who viewed").
- **Co-founder sub-marketplace** separate from the partnership listing type.
- **Advisory-marketplace pricing model.**
- **Readiness assessment scoring.**
- **Events / demo days.**
- **Sector / proximity filters on browse.** Mentioned in early design;
  deferred — requires `workspace.sector` data model expansion.
- **Inbox / messaging between parties.** Contact info is exchanged by email;
  no on-platform DMs.
- **Multi-user listings.** A listing is owned by one workspace.

## 4. Users and Personas

| Persona | Description | Primary action | Success looks like |
|---|---|---|---|
| **Exit Seller** (Samir) | Founder of a real KSA company with active sale intent. | List for exit (named, public summary, structured ask details). | Inquiry from a credible buyer they actually want to talk to, within 30 days. |
| **Exit Buyer** | Other VenturePath workspace owners with capital. Either acquirer principals or strategic intermediaries. | Browse exits, send inquiry on one that fits. | Contact reveal + data-room access; off-platform conversation begins. |
| **Partnership Seeker** (Saif) | Founder looking for co-founder, advisor, senior hire, or business partner. | List partnership (named, structured seeking-type and skills). | Inquiry from a credible candidate. |
| **Partnership Inquirer** | Founder or operator who matches the seeker's profile. | Browse partnerships, send inquiry. | Contact reveal; off-platform conversation begins. |

The exit-buyer and partnership-inquirer personas were not pre-validated with
named individuals at launch. The exit-seller and partnership-seeker personas
were validated by direct founder follow-up.

## 5. Solution Overview

### 5.1 Two listing types, one data model

`listing_type IN ('exit', 'partnership')`. One schema with type-specific
structured data in a JSONB column. Cross-workspace browse (the whole point);
workspace-private write.

**Exit listing fields:**

- `ask_type` (radio: Active sale | Open to offers | Acqui-hire | Merger)
- `ask_amount_sar` (optional NUMERIC)
- `sector` (free text)
- `stage` (free text)

**Partnership listing fields:**

- `seeking_type` (radio: Co-founder | Advisor | Senior hire | Business partner)
- `skills` (tag list, max 10)
- `equity_expectations` (free text, max 200 chars)
- `commitment_type` (radio: Full-time | Part-time | Advisory | Flexible)

**Shared fields:**

- `public_summary` (required, max 500 chars, visible to all VenturePath members)
- `notes` (optional, max 1000 chars, owner-only)

### 5.2 Inquiry handshake (one-step accept)

```
sent ──────────── owner accepts ──────────── accepted ──── either party closes ──── closed
 │                                               │
 └──── owner declines ──── declined (terminal)  └── (inquirer can only close after accepted)
```

**Actor rules for close:**

- Inquirer can close only if status = `accepted`
- Owner can close from `sent` or `accepted`
- Nobody can close `declined` (terminal) or `closed` (idempotent no-op)

**Contact reveal mechanism:** On accept, the platform generates a scoped
`data_room_links` row (signed token, configurable TTL: default 14 days, max 90).
Both parties receive an email; the inquirer's email includes a link to the
data room scoped to the configured access tier (intro / standard / diligence).
This reuses the existing data-room token mechanism — no new auth concept
introduced.

### 5.3 Collision rules

Three rules, all enforced in the RPCs with `FOR UPDATE` locking. The
existing `share_listings` RPC was extended (REGRESSION-tested) to enforce the
bidirectional version of the first rule.

| Rule | Enforced in |
|---|---|
| Open exit listing ↔ Open share_listings (mutually exclusive) | `create_connection_listing` AND `create_share_listing` |
| Open exit listing ↔ Open partnership listing (mutually exclusive) | `create_connection_listing` |
| One open exit listing per workspace | `create_connection_listing` |

Rationale: a marketplace listing should mean exactly one thing about the
workspace's intent. A company that's "for sale" AND "looking for a co-founder"
sends a confusing signal to either side.

### 5.4 Cross-workspace RLS

Reads:

```sql
EXISTS (
  SELECT 1 FROM workspaces WHERE owner_user_id = auth.uid()
  UNION
  SELECT 1 FROM workspace_members WHERE user_id = auth.uid()
)
```

Writes: `workspace_id` must be a workspace the caller owns. This is the
explicit departure from the secondary share marketplace, which is
workspace-private. Cross-workspace browse is the whole point.

### 5.5 Audit trail

`audit_events.entity_type` CHECK constraint extended to include
`connection_listing` and `connection_inquiry`. The existing immutability
trigger (which blocks UPDATE/DELETE on marketplace audit rows) now covers
these too. Audit rows for these entities are tamper-proof at the database
level.

## 6. Design Decisions

These are decisions locked during /plan-eng-review and /plan-design-review.
Reverting any of them is a deliberate v2 scope choice, not a bug fix.

| # | Decision | Why |
|---|---|---|
| 1 | One unified product (not two separate Exit Hub + Partnership Hub) | Two sides of the same marketplace, ~80% shared data model, half the implementation cost. |
| 2 | Named listings only in v1 | Probuy is identifiable from sector + KSA market size; weak anonymization is worse than no anonymization. |
| 3 | One-step accept (owner accept = contact reveal) | Two-step adds a round-trip and a second race condition; not worth it at v1 scale. |
| 4 | Workspace-verified read RLS (not pure `auth.uid() IS NOT NULL`) | A user without a workspace can't post an inquiry; surfacing listings to them is a UX dead-end. |
| 5 | Magenta exits / lavender partnerships (chart palette colors) | Parallel to DESIGN.md §3.6 iSAFE green precedent — important product concepts get permanent visual identity. |
| 6 | Bidirectional exit/share collision | Whole-company sale supersedes individual share sales — clear marketplace signal. |
| 7 | Exit + partnership cannot coexist | One listing = one intent. |
| 8 | Glass-card status panel for inquiry states | Each state has warmth and context, not just a different button color. Reuses DESIGN.md §7 glass-refraction primitive. |
| 9 | Same URL for owner vs non-owner detail page | Conditional sections; one listing = one identity. |
| 10 | Inquiries live on the listing detail page (not a separate inbox) | ~~At v1 scale (1-2 listings per owner) the ROFR-row pattern is sufficient. Inbox route is a deferred TODO.~~ **Superseded in v1.1:** shipped `/messages` as the unified inbox; the listing detail page still shows per-listing inquiries (no regression), but `/messages` is the primary entry point from the sidebar. |
| 11 | Email DNA matches investor-update template | Avoids AI-slop patterns; reinforces a single brand voice for transactional emails. |
| 12 | Three migrations (schema, RPC regression, latent-bug fix) | Each is independently meaningful and bisectable. |

## 7. Architecture (locked in eng review)

```
INQUIRY STATE MACHINE
  sent ──────────── owner accepts ──────────── accepted ──── either party closes ──── closed
   │                                               │
   └──── owner declines ──── declined (terminal)   └── (inquirer can only close after accepted)

COLLISION RULES (all enforced in RPCs with FOR UPDATE)
  exit listing        ←→ open share_listings      (bidirectional)
  exit listing        ←→ open partnership listing
  exit listing        ←→ open exit listing        (uniqueness)

CROSS-WORKSPACE RLS
  Read:  EXISTS user owns or is a member of any workspace
  Write: workspace_id IN (workspaces owned by user)

INDEXES
  connection_listings_browse_idx:    (listing_type, status, listed_at DESC) WHERE deleted_at IS NULL
  connection_listings_workspace_idx: (workspace_id, status) WHERE deleted_at IS NULL
  connection_inquiries_unique_live_idx: UNIQUE (listing_id, inquirer_user_id) WHERE status IN ('sent','accepted')

DATA ROOM ACCESS (for accepted inquirers)
  On inquiry accept: generate a time-limited signed token for the existing
  /data-room/[token] mechanism. Include token in the acceptance email.
  No workspace membership grant. Token expiry: configurable (default 14 days).

DASHBOARD PULSE QUERY (single round-trip)
  Counts open listings + new inquiries this week with one JOIN.
```

## 8. Failure Modes

| Codepath | Failure mode | Test? | Error handling? | User sees |
|---|---|---|---|---|
| `create_connection_listing` | Auth check fails | Yes (pgTAP) | RAISE in RPC | 500 → server action error in form |
| `create_connection_listing` | Collision with `share_listings` | Yes | RAISE | Readable form error |
| `send_connection_inquiry` | Self-inquiry | Yes | RAISE | Form error |
| `send_connection_inquiry` | Duplicate inquiry | Yes | RAISE + unique index | CTA replaced with "pending" chip |
| `accept_connection_inquiry` | Not listing owner | Yes | RAISE | 403 from server action |
| `accept_connection_inquiry` | Race: two simultaneous accepts | `FOR UPDATE` prevents | RAISE | Only first caller succeeds |
| Resend email (acceptance) | `RESEND_API_KEY` missing | Surfaced via `emailWarning` | best-effort | Action returns `emailWarning`; UI shows fallback note |
| Data room token | Workspace has no published data-room tier | Guarded in `acceptConnectionInquiry` action | Token generation skipped | Acceptance email omits the data-room CTA |
| `audit_events` INSERT | `entity_type` constraint | Yes (extends existing) | `logAudit` swallows | Silent audit gap (best-effort by design) |

## 9. Test Coverage

**pgTAP suite** (`supabase/tests/connections_rls.sql`): 22 cases covering
RLS isolation, RPC guards, audit immutability, and a REGRESSION test for the
`create_share_listing` exit-collision guard.

**DB smoke tests** (run against dev project during /ship): 12 of 12 cases
passed end-to-end, including the full inquiry lifecycle, data-room link
creation, and URL-safe token generation.

**TypeScript:** clean (`tsc --noEmit`).

**Vitest:** 123 preexisting tests pass; no new TS unit tests added (the RPC
logic is best tested at the DB level via pgTAP).

**Browser QA:** not completed from the ship environment (network policy
blocks outbound to supabase.co). Owner-side TODO.

## 10. Success Criteria

- **Day 7:** Samir lists Probuy for exit. Saif posts a partnership listing.
- **Day 30:** 5+ additional listings (any type), all seeded from the founder's
  network. At least one inquiry → off-platform conversation.
- **Day 90:** One closed deal (exit OR partnership) by the founder's
  attestation.

### Kill criteria

If by day 30 no listings beyond Samir and Saif have happened despite direct
outreach to the founder's network, **Premise 1 is wrong** (recurring KSA
founder archetypes assumption fails) and the product is for two specific
people, not a market. In that case: pause the Connections Hub, deprecate
listings, refund any nominal seed.

## 11. Open Questions and External Blockers

Tracked in `TODOS.md` as BLOCKING preconditions for the **exit listing type**
specifically. Partnership listings can ship without these.

| Item | Status | Owner | Blocks |
|---|---|---|---|
| Confirm Samir accepts public named listing for Probuy | TODO | Samir call | Exit listing type for v1 |
| Sharia consult extension — Turky | TODO | Turky scoping call | Exit + partnership Sharia clearance |
| CMA broker-dealer go/no-go — Mahmoud | TODO | Mahmoud call | Exit listing type |

## 12. Rollout Plan

**Phase 0 (Pre-launch, weeks 1–2):** Resolve the three blocking external
items (Samir / Turky / Mahmoud calls). Manually seed 8–10 listings from the
founder's existing network. Adjust copy if any blocker requires it.

**Phase 1 (Soft launch, weeks 3–4):** Quietly enable the sidebar entry for
the founder's known KSA network (50–100 founders). No public announcement.
Watch dashboard pulse, watch inquiry handshake completion rate, watch which
listing types attract the most inquiries.

**Phase 2 (Public launch, week 5+):** Public announcement on the founder's
channels. Open `/connections` to all VenturePath workspace owners. Monitor
the day-30 and day-90 success criteria.

**Kill switch:** Withdraw all listings via `withdraw_connection_listing` RPC.
The sidebar entry can be feature-flagged in `sidebar.tsx` if a fast retreat
is needed.

## 13. Distribution

Web service. Same Next.js / Supabase / Vercel stack as the rest of
VenturePath. No new distribution channel.

**v1.0 sidebar shape:** single entry under the **Investment** group,
between **Marketplace** and Modeling.

**v1.1 sidebar shape (superseded):** the Investment group was dissolved
and Connections is now reached from four top-level sidebar entries:

| Entry | Route | Surface |
|---|---|---|
| Marketplace | `/marketplace` (Browse tab) | Cross-workspace public secondary listings + open exit listings, side by side. Exits read from `connection_listings WHERE listing_type='exit' AND status='open'`. |
| Round | `/rounds` (Open tab) | Cross-workspace open rounds. Adjacent to Connections, not part of it, but built with the same `is_public` opt-in pattern. |
| Messages | `/messages` | Inquiry inbox (see §18.2). |
| Talents | `/connections?seeking=senior_hire` | Partnership listings filtered to `type_data->>'seeking_type' = 'senior_hire'`. |
| Advisors | `/connections?seeking=advisor` | Partnership listings filtered to `type_data->>'seeking_type' = 'advisor'`. |

The unfiltered `/connections` page is still reachable from the Messages
empty-state CTA, the Marketplace exit-listing detail links, and direct
URL entry; partnership and exit filter chips behave as before.

## 14. Dependencies

- **Secondary share marketplace v1** (Approach A bulletin board) — shipped
  in a prior PR. Sets the data + UI pattern and provides the
  `create_share_listing` RPC that this PR extends with the bidirectional
  collision guard.
- **`data_room_links` token mechanism** — preexisting. Used to mint scoped
  data-room access tokens on inquiry accept. The default `encode(...,
  'base64url')` had a latent bug (PG18-only) that was fixed in this PR.
- **Resend email** — already integrated. Four new email templates added in
  `lib/email/connections.ts`, matching the existing investor-update DNA.
- **Workspace model** — `workspaces`, `workspace_members`, `getActiveWorkspace()`.
  Connections Hub adds no new identity concept; it reuses the existing
  workspace identity for both seller and buyer sides.
- **Audit trail** — extended `audit_events.entity_type` CHECK constraint and
  immutability trigger.
- **Turky** (Sharia advisor): scope extension required before public launch.
- **Mahmoud** (CMA broker-dealer contact): go/no-go required for exit
  listings specifically.

## 15. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Samir says no to public named listing | Medium | Pauses exit listing type | Partnership listings ship independently; revisit anonymous tier in v2 if Samir's signal generalizes. |
| Mahmoud / Turky surprises | Medium | Delays launch | Both consults are scoping calls, not full audits. Frame: "we're extending the bulletin-board pattern; same off-platform-closing model." |
| Cold-start: <5 listings by day 30 | Medium | Premise 1 disproved | Founder manually seeds 8–10 listings from existing network in Phase 0 before public launch. |
| Resend email delivery fails on accept | Low | Acceptance state visible in UI but inquirer doesn't get contact email | Server action surfaces `emailWarning` to the owner; owner can copy contact details manually. |
| Click-through NDA insufficient for real exit | Low (v1) | Owner declines acceptance during real diligence | v1 ships named-only without NDA tier. If Mahmoud later requires real NDA, add DocuSign-style step in v2. |
| Data-room token forwarded by inquirer | Low | Third party gets scoped data-room access | Same risk profile as the existing share-link mechanism. Owner can revoke `data_room_links.is_active`. Token TTL caps blast radius. |
| Two parallel accept requests on the same inquiry | Very low | Race condition | `FOR UPDATE` lock in `accept_connection_inquiry` RPC. Second caller gets "inquiry is already accepted." |

## 16. Out-of-Scope (deferred to v2)

- Algorithmic matching (browse + filter is the v1 wedge)
- Anonymous / blind listings tier
- DocuSign-style real NDA at data-room access tier upgrade
- Sector / proximity filters on browse
- ~~Inquiry inbox route (when an owner has 10+ listings)~~ — **Shipped in v1.1** as `/messages` (see §18.2)
- On-platform messaging (the `/messages` inbox is a *read-only* status
  view of `connection_inquiries`; no in-thread DMs)
- Monetization (listing fees, view-counts, paywalls)
- Co-founder sub-marketplace separate from partnership listings
- Advisory marketplace with pricing
- Readiness assessment scoring
- Events / demo days
- TypeScript canonical type regeneration (the hand-tuned types in
  `lib/supabase/types.ts` work for both new and preexisting code; canonical
  regen would require a separate cleanup PR aligning NUMERIC column usages
  in `marketplace/actions.ts` and `esop/actions.ts`)

## 17. References

- Office-hours design doc (Markdown) in
  `~/.gstack/projects/waleedahmedalsanosi-VenturePath/`
- DESIGN.md §3.6, §8, §12
- TODOS.md
- CHANGELOG.md v0.2.0.0 entry
- PR #1: https://github.com/waleedahmedalsanosi/VenturePath/pull/1

## 18. v1.1 Surface Updates (2026-05-16)

The v1.0 data model, RPCs, RLS, and audit trail are unchanged in v1.1.
What shipped is a navigation restructure that gives the Connections Hub
four entry points instead of one, plus a dedicated inquiry inbox.

### 18.1 Sidebar restructure

The sidebar was redesigned to surface cross-workspace discovery as
top-level concepts. Connections-relevant entries are itemised in §13
above. The four implications for the Connections Hub:

1. **Exit listings are co-located with secondary share listings on
   `/marketplace`.** Buyers no longer have to context-switch between
   /marketplace (shareholders selling equity) and /connections (companies
   open to exit) — the redesigned `/marketplace` Browse tab queries both
   in one round-trip. The /connections page remains canonical for the
   exit listing detail and inquiry flow.
2. **Partnership browse is now role-scoped by default.** A founder
   landing on the sidebar's "Talents" or "Advisors" entry sees a
   pre-filtered partnership list, not the full mix. Co-founder and
   business-partner listings are still reachable via the unfiltered
   `/connections` page and the existing partnership filter chip.
3. **Connections is no longer behind a workspace nav group.** It is
   surfaced at top level, increasing visibility for cross-workspace
   browse — the original v1 placement under Investment was workspace-
   centric and obscured the cross-workspace nature.
4. **The Messages entry replaces the inline inquiry-row pattern as the
   primary entry point** (see §18.2 and the supersedes note on
   Decision #10).

### 18.2 `/messages` — inquiry inbox

A dedicated read surface for `connection_inquiries` where one of the
user's accessible workspaces is on either side of the inquiry.

**Data model:** none added. Reuses the existing
`connection_inquiries_visible_to_parties` RLS policy — a single SELECT
returns the user's full inbox; incoming vs outgoing is classified in JS
by comparing `inquirer_workspace_id` against the user's owned/joined
workspace IDs.

**Filters:**

- Direction: `?direction=incoming|outgoing` (default: all)
- Status: `?status=sent|accepted|declined|closed` (default: all)

**Counts:** the chips show All / Incoming / Outgoing with live counts
from the same query result (no extra round-trips).

**Row contents:** status chip (with tone per state), direction chip,
listing type chip (exit / partnership), counterparty workspace name
(listing owner if outgoing; inquirer workspace if incoming), inquiry
message or listing summary, sent date. Row click navigates to the
listing detail page (`/connections/[id]`), which remains the canonical
place to *act* on an inquiry (accept / decline / close). The inbox is
read-only by design — it is the routing surface, not a second action
surface.

**Empty state:** routes the user to `/connections` to browse listings,
since an empty inbox at v1.1 scale almost always means the user has not
sent any inquiries yet.

### 18.3 Seeking filter on `/connections`

`/connections/page.tsx` honors a new query param surface:

- `?seeking=co_founder|advisor|senior_hire|business_partner` —
  filters `connection_listings` by `type_data->>'seeking_type'`.
- `?role=talent|talents|advisor|advisors` — alias the sidebar uses;
  mapped to canonical seeking values (`talent[s]` → `senior_hire`,
  `advisor[s]` → `advisor`).
- A seeking filter implies `filter=partnership` even if filter wasn't
  passed.

When a seeking filter is active, the page heading swaps to the seeking
label (e.g. "Advisor") and a "Clear filter" link appears below the
header, returning to the unfiltered `/connections`.

The filter chips bar still renders the four base filters (All / Exit /
Partnership / Mine); the seeking chip is implicit in the URL rather than
a separate chip in the bar, since there are four mutually-exclusive
seeking values and chip-bar real estate is already saturated. This is a
v1.1 trade-off — a future v1.2 may replace the implicit URL with an
inline seeking dropdown if usage data shows the URL-driven model is
unintuitive.

### 18.4 i18n surface

Three new namespaces (`settings`, `profile`, `messages`) registered in
`I18nProvider` with full EN + AR resources. The existing `nav`,
`marketplace`, `rounds`, and `connections` namespaces gained keys for:

- `nav.{messages,talents,advisors,marketplace_top,rounds_top,my_profile}`
- `marketplace.{tabs.*,browse.*}`
- `rounds.{tabs.*,browse.*}`
- `connections.filter.clear`

Arabic translations cover all new keys; the RTL layout is preserved on
every redesigned surface (sidebar logical properties, marketplace browse,
rounds browse, messages inbox, settings, profile).

### 18.5 What did *not* ship in v1.1

The following items were considered for v1.1 but explicitly deferred:

- **A schema column for `partnership_role`.** Talents and Advisors are
  filtered via JSONB (`type_data->>'seeking_type'`), which keeps the v1
  data model intact but requires a JSONB index for scale. If
  `/connections?seeking=...` becomes a hot path, promote `seeking_type`
  to a first-class column with an index.
- **Action capabilities on `/messages`.** The inbox is read-only;
  accepting/declining/closing still happens on the listing detail page.
  In-row actions are a deferred v1.2 nice-to-have once inquiry volume
  per owner exceeds the ~5 mark.
- **Publish flow for `share_listings.is_public` and
  `financing_rounds.is_public`.** The redesigned Marketplace and Round
  browse tabs already query these columns, but there is no UI yet for a
  shareholder/founder to flip the flag from inside the app — current
  default is `false`, opt-in by SQL. ~~This is a separate Publish PRD
  (P0 for round/listing publishers, currently blocking discoverability
  on a fresh workspace).~~ **Shipped in v1.2 (see §19.4).**

## 19. v1.2 Updates (2026-05-17)

v1.2 closes the three deferral items from §18.5 and adds a fourth
surface that the v1.1 audit flagged: equity-terms gating. None of the
v1.0/v1.1 invariants change. The schema gains one column, one new table,
and zero RPC signature changes.

### 19.1 `seeking_type` promoted to first-class indexed column (REQ-PART-01)

Closes the §18.5 deferral on `partnership_role`.

- Migration `20260519400000_seeking_type_column.sql`:
  - `ALTER TABLE connection_listings ADD COLUMN seeking_type TEXT` with
    CHECK `IN ('co_founder', 'advisor', 'senior_hire', 'business_partner')`.
  - `UPDATE` backfill from `type_data->>'seeking_type'` for existing
    partnership rows.
  - Partial index `connection_listings_seeking_type_idx (seeking_type,
    status, listed_at DESC) WHERE deleted_at IS NULL AND listing_type
    = 'partnership' AND seeking_type IS NOT NULL`.
- `create_connection_listing` RPC redeployed: when `listing_type =
  'partnership'`, validates and writes the column alongside the JSONB.
- `app/(app)/connections/page.tsx` browse query swapped from
  `eq("type_data->>seeking_type", $)` to `eq("seeking_type", $)`.
- Backfill parity verified live: 6/6 partnership rows backfilled, all
  values within the allowed enum.

**Trade-off:** the JSONB `type_data` still carries `seeking_type` for
backward compatibility. v1.3 may strip it from JSONB after a deprecation
window.

### 19.2 Reply-capable thread view at `/messages/[inquiryId]` (audit item #7)

Closes the §18.5 deferral on action capabilities in `/messages` AND
addresses audit item #7 (no reply / compose).

- Migration `20260520300000_inquiry_messages.sql` adds the
  `connection_inquiry_messages` table:
  - `id`, `inquiry_id` (CASCADE), `sender_user_id`, `body` (1-2000 chars),
    `created_at`, `deleted_at`.
  - Index `(inquiry_id, created_at)`.
  - RLS read: either party of the underlying inquiry (mirrors
    `connection_inquiries` SELECT policy).
  - RLS write: either party, AND only when inquiry status is `'sent'`
    or `'accepted'`. Closed/declined inquiries are read-only.
- New route `/messages/[inquiryId]/page.tsx` (server) +
  `thread-view.tsx` (client): inquiry metadata header, message bubbles
  styled per sender, reply textarea (max 2000 chars with counter),
  disabled state for closed/declined with a hint.
- `/messages` inbox row click target changed from
  `/connections/[listingId]` to `/messages/[inquiryId]`. A secondary
  "View listing →" link inside each row preserves the old action path.
- `/connections/[id]` inquiry detail panel gains a "View thread →" link
  per inquiry. The two surfaces are now complementary: `/messages/[id]`
  is the conversation surface; `/connections/[id]` is the action
  surface (accept / decline / close).

**Supersedes Decision #10 again:** v1.1 had already softened
Decision #10 by adding the `/messages` routing inbox. v1.2 completes
the move — the inbox is now a real reply surface, not just a router.

**Out of scope (v1.3):** notification trigger on new inquiry message
(no row in `account_notifications` yet when a reply lands). This is a
single trigger function away.

### 19.3 Context-aware eyebrow + subtitle per seeking variant (audit item #12)

`/connections?seeking=…` previously rendered "INVESTMENT" eyebrow with
a generic subtitle on every variant. v1.2 swaps both per `seeking`:

| Seeking value | Eyebrow | Subtitle |
|---|---|---|
| (none) | "Connections" | (existing subtitle) |
| `senior_hire` | "Talents" | "Senior hires open to joining KSA startups." |
| `advisor` | "Advisors" | "Industry experts available for advisory engagements." |
| `co_founder` | "Co-founders" | "Founders open to joining a co-founder team." |
| `business_partner` | "Business partners" | "Operators open to commercial partnerships." |

New i18n keys: `connections.header.eyebrow.*` and
`connections.header.subtitle.*` in EN + AR.

### 19.4 Publish flow for `share_listings.is_public` and `financing_rounds.is_public`

Closes the §18.5 final deferral. Documented in detail in the
product-wide PRD §13.2 (REQ-INV-02) and §13.3 (REQ-TRADE-01). The
Connections Hub doesn't own these columns but its `/marketplace` and
`/rounds` browse tabs depend on them being flippable from the UI.

### 19.5 Equity-terms gating on partnership listings (audit item #10)

The audit flagged that partnership listings broadcast
`equity_expectations` (e.g. "0.25-0.5% advisor equity, 2y vest") to every
signed-in user — leaking sensitive negotiating terms across all
workspaces.

v1.2 ships UI-level gating:

- `app/(app)/connections/[id]/equity-gate.tsx`: lock-icon card that
  replaces the inline equity_expectations text on the listing detail
  page when `canSeeEquityTerms === false`.
- **Authorisation rule:** `canSeeEquityTerms = isOwner ||
  (myInquiry?.status === 'accepted')`. Listing owner always sees.
  Viewers with no inquiry / pending / declined: gated. Accepted: full
  view.
- The gate card has a "Request equity terms" button that fires the
  existing `send_connection_inquiry` RPC — same flow as any other
  inquiry, no new RPC needed.
- A `gating_hint` paragraph on the partnership listing creation form
  tells listers the field is gated by default.
- New i18n keys: `connections.gated_title`, `gated_body`, `gated_button`,
  `gated_pending`, `card.equity_gated`, `gating_hint` in EN + AR.

**Known limitation, deferred to v1.3:** gating is UI-only. The
`type_data` JSONB column is still cross-workspace-readable at the DB
level, so a determined inquirer can query the column directly and see
the field. The proper fix is to split `type_data` into
`type_data_public` (RLS allows cross-workspace read) and
`type_data_private` (RLS restricts to owner + accepted-inquiry
inquirer). The v1.2 UI gate buys time; the v1.3 schema split closes
the loophole properly.

### 19.6 Updated decisions ledger

| Decision | Status |
|---|---|
| #10 — inquiries on listing detail only | **Superseded twice:** v1.1 added `/messages` as routing inbox; v1.2 made it a reply surface via `/messages/[inquiryId]`. The listing-detail action panel is preserved. |
| #6 — bidirectional exit collision | Unchanged. |
| #7 — exit + partnership cannot coexist | Unchanged. |
| #2 — named listings only in v1 | Unchanged. Equity-terms gating (§19.5) is a separate axis from name visibility. |
| #5 — magenta exits / lavender partnerships | Unchanged. |

### 19.7 Test coverage delta in v1.2

- Inquiry messages: 3/3 BEGIN/ROLLBACK smoke cases (both-parties read,
  closed-inquiry write rejection, cross-party write rejection).
- Seeking column: backfill parity verified (6/6 partnership rows).
- Equity gate: UI-only — covered by existing /connections snapshot
  tests; no new RPC, no new SQL test.

### 19.8 What v1.2 did NOT change in the Connections Hub

- The 12 decisions in §6 (other than #10 which was already softened in
  v1.1).
- The 3 collision rules in §5.3.
- The cross-workspace RLS in §5.4.
- The inquiry handshake state machine in §5.2.
- Pricing / monetisation (still pre-revenue by design).
