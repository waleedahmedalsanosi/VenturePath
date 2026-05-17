# TODOS

Deferred work captured during reviews. Each item has enough context that
someone picking it up in 3 months can resume without re-deriving the
motivation.

## Open

### Sharia advisor consult — extended to Connections Hub (BLOCKING)

**What:** Ask VenturePath's existing Sharia advisor whether (a) the
secondary share marketplace bulletin board (original scope), (b)
whole-company exit listings, and (c) partnership/co-founder listings
with equity expectations raise gharar (uncertainty) or other concerns.
Specific new questions for Connections Hub:
- Does posting a whole-company exit ask differ from a secondary share
  sale in Sharia terms?
- Does a co-founder posting with equity expectations trigger any
  independent Sharia concern?

**Why:** Sharia clearance is table stakes for the KSA market. The
secondary marketplace consult was already scoped. Connections Hub adds
two new transaction types that were not in the original scope.
Partnership listings may be low-risk, but exit listings (whole-company
sale) need explicit clearance.

**Pros:** Existing Turky relationship means this is a scope extension,
not a new engagement. One additional scoping call clears the gate.

**Cons:** Advisor may flag exit listings as a separate transaction
type requiring a more formal audit.

**Context:** Approach A (secondary share marketplace) was selected
after /plan-eng-review on 2026-05-16. Connections Hub was added in
/plan-eng-review on 2026-05-16 as a unified exit + partnership
marketplace.

**Depends on:** Existing Turky relationship.

**Contact:** Turky.

---

### Beta-user recruitment call — Samir

**What:** First marketplace beta-user call with Samir, the shareholder
who originally asked for secondary-share functionality. Capture exact
quote, target transaction size, target company, timeline, and whether
posted-ask (Approach A) is enough or he needs price discovery / escrow.

**Why:** Samir's real transaction is the canary. If Approach A is
enough to close his sale, Approach B's escrow + matching engine stay
deferred. If he needs price discovery or escrow, that's a kill-criterion
signal to revisit Approach B.

**Depends on:** Approach A shipping to staging.

**Contact:** Samir.

---

### Broker-dealer go/no-go — Mahmoud (BLOCKING for exit listing type)

**What:** Two-part consult with Mahmoud (CMA-licensed broker-dealer
contact):
1. Original scope: explore what a future Approach B (full marketplace
   with escrow + matching) would look like — KYB requirements, escrow
   structures, settlement timelines, fee ranges.
2. New scope (BLOCKING): confirm that whole-company exit listings on
   a bulletin-board model (no escrow, no fund movement on platform,
   off-platform closing via lawyer + SPA) do NOT require a CMA-licensed
   broker-dealer intermediary. If CMA requires a licensed intermediary
   for whole-company exit postings, exit listings cannot ship as-is.
   Partnership listings ship independently in that case.

**Why:** Secondary share listings cleared the CMA question because
SAMA/CMA bulletin-board interpretations generally don't require licensing
for posted asks with off-platform closing. Whole-company exits may be
treated differently. One call confirms the scope.

**Depends on:** Nothing — runs in parallel with Connections Hub
implementation. Must resolve before exit listing type ships.

**Contact:** Mahmoud.

---

### Confirm Samir accepts named listing for Probuy (BLOCKING for exit type)

**What:** During the Samir call this week (already assigned in the design
doc), explicitly confirm: "Your company's name, sector, and a summary of
your financials will be visible to any signed-in VenturePath user. Are
you OK with that?"

If yes: exit listing type ships as designed (named, public summary,
financial details revealed only after inquiry handshake).

If no: exit listing type is paused. Partnership listings ship
independently. Anonymous/blind listing tier goes on the v2 roadmap.

**Why:** The design doc justified named-only on the grounds that
anonymization is impossible (Probuy is identifiable from sector + KSA
market size). This reasoning is sound. But Samir's comfort with public
disclosure is a prerequisite assumption that hasn't been confirmed.
Samir is the first and only planned exit beta user.

**Depends on:** The Samir call already assigned in the design doc.

**Contact:** Samir.

---

### Real 2FA enrollment + active sessions (v1.3 P0)

**What:** Settings → Security ships in v1.2 with "Coming soon" scaffold
cards for 2FA and active sessions. Wire them to Supabase MFA:
1. TOTP enrollment + QR code render + verify step.
2. Active session list via Supabase admin API + per-session revoke.
3. Optional SMS fallback (KSA mobile providers vary in TOTP availability).

**Why:** A B2B SaaS holding cap-table data with no 2FA option is a
posture gap, not a feature gap.

**Depends on:** Supabase MFA setup decision (TOTP-only vs TOTP + SMS).

**Contact:** Self-serve, but the UI scaffold is in
`app/(app)/settings/settings-view.tsx` `SecuritySection`.

---

### Notification-preference enforcement in email delivery (v1.3 P0)

**What:** `user_notification_preferences` (composite PK
`user_id, notification_type`) was added in v1.2 and the toggles work in
the UI, but the email send paths in `lib/email/*` do NOT yet read the
table before sending. Wire it: per send, check the recipient's row, skip
the email if `email_enabled=false` for that type.

**Why:** Users can mute the toggle today and still receive the emails.
This is a P0 trust issue.

**Depends on:** Nothing — the table + UI are already shipped.

---

### Account-deletion fulfilment cron (v1.3 P0)

**What:** v1.2 ships `account_deletion_requests` (INSERT-only RLS) and
the "your account will be deleted within 30 days" copy. A scheduled job
that actually deletes the workspace + owned data after the 30-day window
is NOT wired.

**Why:** KSA PDPL Article 32 (right to erasure) needs a fulfilment
mechanism, not just a request endpoint.

**Depends on:** Decision on scheduler (Supabase pg_cron vs. external
cron via Vercel Cron Jobs).

---

### DB-level equity-terms column split (v1.3 P1)

**What:** v1.2 gates `equity_expectations` on partnership listings at the
UI layer. The `type_data` JSONB column is still cross-workspace-readable
at the DB level via direct SELECT. Proper fix: split into
`type_data_public` (kept cross-workspace-readable) and `type_data_private`
(RLS scoped to owner + accepted-inquiry inquirer). Migrate existing rows.

**Why:** UI gating is theatre against a determined attacker. The DB-
level split is the real fix.

**Depends on:** Nothing — pure refactor.

---

### Search across investor_updates / term_sheets / audit_events (v1.3 P2)

**What:** v1.2 search covers workspaces, connection_listings, and
financing_rounds. Extend the tsvector + GIN pattern to investor_updates
(subject + body), term_sheets (investor_name + firm + notes), and
audit_events (description). Update `search_platform` to UNION ALL across
all six sources.

**Why:** Power users will want to search their own investor-update
history; team members want to grep audit events.

**Depends on:** Nothing — the pattern is identical to what's already
shipped in `20260519000000_full_text_search.sql`.

---

### Notification trigger on inquiry-message reply (v1.3 P1)

**What:** v1.2 ships the thread view at `/messages/[inquiryId]` and
the `connection_inquiry_messages` table, but no `account_notifications`
row is created when a reply lands. Add a trigger on INSERT into
`connection_inquiry_messages` that notifies the OTHER party (not the
sender).

**Why:** Without a notification, users have to poll the thread view to
see replies. The notification is the whole point of having the inbox.

**Depends on:** Nothing — same pattern as the existing 4 notification
triggers in `20260518000000_account_notifications.sql`.

---

### OAuth providers — Google / LinkedIn / Apple (v1.3 P2)

**What:** The sign-in / sign-up split-layout pages have visual buttons
for all three since v1.1. None are wired. Pick a starting provider
(probably Google), register the OAuth app, wire `signInWithOAuth`.

**Why:** Friction reduction on signup; not blocking on anything.

**Depends on:** OAuth app registration with each provider.

---

---

## Closed

### Sharia advisor consult — extended to Connections Hub

**What:** ~~Get Turky's sign-off on whole-company exits + partnership
listings with equity expectations.~~
**Status:** Still BLOCKING for Exit Hub public launch. Moved here as a
placeholder, but is actually still open. **Re-opened above.**

### Discoverability gap closure (Publish PRD — was P0)

**What:** Toggle `is_public` from inside the app for both
`financing_rounds` and `share_listings`.
**Resolved:** Shipped in v1.2 as REQ-INV-02 (rounds) and REQ-TRADE-01
(share listings). Toggle in creation wizard + management view; audit
rows write `entity_type` matching the entity. ROFR window blocks the
listing toggle when active.
**Completed:** v0.3.0.0 (2026-05-17)

### Atomic round-close (RPC) — was P0

**What:** Round close was running N+M sequential Supabase calls in TS;
no transactional boundary; mid-flight failure left orphaned rows.
**Resolved:** Shipped `close_financing_round` RPC in v1.2. TS computes
the conversion plan; SQL applies it in one transaction with audit.
**Completed:** v0.3.0.0 (2026-05-17)

### Notifications aggregation + bell wiring — was P1

**What:** Header bell was visual-only.
**Resolved:** `account_notifications` table + 4 triggers + API + bell
rewritten with 60s poll + popover + read-all.
**Completed:** v0.3.0.0 (2026-05-17)

### Full-text search + ⌘K — was P1

**What:** ⌘K search bar was visual-only.
**Resolved:** tsvector + GIN + `search_platform` RPC + ⌘K dropdown with
debounce + grouped results + keyboard nav.
**Completed:** v0.3.0.0 (2026-05-17)

### Investor-update per-recipient open tracking — was P1

**What:** `investor_updates` send had no record of recipients; no per-
person open rate; no resend.
**Resolved:** `investor_update_recipients` table + per-email `?r=` URLs
+ resend-to-unopened action.
**Completed:** v0.3.0.0 (2026-05-17)

### Transfer-agent cap-table sync on secondary sale — was P1

**What:** `mark_share_listing_sold_off_platform` flipped status but
didn't update the cap table.
**Resolved:** RPC overloaded with `(buyer_name, buyer_email, sale_price)`
params. Atomic cap-table sync when buyer details supplied. Backward
compatible.
**Completed:** v0.3.0.0 (2026-05-17)

### M&A modelling RPC — was P1

**What:** `/acquisition` was client-side math with no persistence.
**Resolved:** `acquisition_models` + `compute_acquisition_model` RPC,
5-scenario cap, `/acquisition` rewritten with saved-scenarios list.
**Completed:** v0.3.0.0 (2026-05-17)

### `seeking_type` column promotion — was P2

**What:** Talents/Advisors filter used JSONB sequential scan with no
index.
**Resolved:** First-class indexed column with backfill + partial index +
RPC update. Backward-compatible (JSONB still carries the value).
**Completed:** v0.3.0.0 (2026-05-17)

### UX audit follow-up (20 items) — was post-v1.1 audit

**What:** External UX/QA auditor flagged 20 items across sidebar
reliability, profile completeness, settings depth, shared UI hygiene,
dilution validation, threaded messaging, and equity gating.
**Resolved:** All 20 items addressed across 6 commits (Batches A-F).
See PRD §13.10-13.15 for the per-batch breakdown.
**Completed:** v0.3.0.0 (2026-05-17)

### Connections Hub filter UX pattern (implementation-time decision)

**What:** Decide the filter UI pattern for /connections browse page.
**Resolved:** Shipped as a horizontal chip row above the listing list
(`app/(app)/connections/page.tsx` `FilterChips` component). Chips:
"All" | "Exit" | "Partnership" | "My listings", filtering via the
`?filter=` URL search param. Matches the design review's safe default.
**Completed:** v0.2.0.0 (2026-05-16)
