# PRD: Connections Hub

**Version:** 1.0
**Status:** Shipped (v0.2.0.0, 2026-05-16)
**Owner:** Waleed Alsanosi
**Repo:** waleedahmedalsanosi/VenturePath
**Related artifacts:**
- Design doc: `~/.gstack/projects/waleedahmedalsanosi-VenturePath/root-claude_activate-bypass-permissions-0sjk1-design-20260516-081800.md`
- Design system updates: `DESIGN.md` §3.6, §8, §12
- Migrations: `supabase/migrations/20260516000004_connections_hub.sql` through `20260516000006_data_room_token_default_fix.sql`
- PR: https://github.com/waleedahmedalsanosi/VenturePath/pull/1

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
| 10 | Inquiries live on the listing detail page (not a separate inbox) | At v1 scale (1-2 listings per owner) the ROFR-row pattern is sufficient. Inbox route is a deferred TODO. |
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
VenturePath. No new distribution channel. Sidebar entry under the
**Investment** group, between **Marketplace** and Modeling.

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
- Inquiry inbox route (when an owner has 10+ listings)
- On-platform messaging
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
