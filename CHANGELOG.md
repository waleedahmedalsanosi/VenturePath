# Changelog

All notable changes to VenturePath will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to a 4-digit version scheme: `MAJOR.MINOR.PATCH.MICRO`.

## [0.3.0.0] - 2026-05-17

### Added

- **`close_financing_round` RPC** — atomic round close in a single transaction.
  Conversion math stays in TS (`lib/cap-table/isafe-math.ts`) for Sharia
  review; SQL handles the apply phase. Adds `entity_type='financing_round'`
  to the audit constraint and immutability trigger so round-close audit
  rows are tamper-proof. 15-case pgTAP suite + live-DB BEGIN/ROLLBACK
  smoke (15/15 pass).
- **`is_public` toggle for financing rounds** (REQ-INV-02) — toggle on
  the round-creation wizard + management view. Audit payload
  `{from: bool, to: bool}` with `entity_type='financing_round'`. Browse
  empty state shows a contextual "you have a private open round" CTA.
- **`is_public` toggle for share listings + ROFR gate** (REQ-TRADE-01)
  — same toggle pattern. Server action + UI both refuse `is_public=true`
  while an unresponded ROFR notification's window is still open.
- **`account_notifications` table** (REQ-PLAT-01) — aggregates 4 trigger
  events (new inquiry, accept, decline, ROFR notified, investor update
  opened) into a per-user feed. Own-rows-only RLS. Header bell rewritten
  from a visual stub to a real polling + popover component. `GET/PATCH
  /api/notifications` endpoints. Smoke 7/7.
- **Full-text search** (REQ-PLAT-02) — `tsvector` STORED columns +
  GIN indexes on workspaces, connection_listings, financing_rounds.
  `search_platform(p_query)` RPC unions all three. ⌘K dropdown wired
  in the header with 300ms debounce, grouped results, keyboard nav,
  ARIA combobox. Smoke 5/5.
- **`investor_update_recipients` table** (REQ-INV-03) — per-recipient
  open tracking via per-email `?r=` URLs. "Re-send to unopened" action.
  RLS via `user_can_access_workspace`.
- **`mark_share_listing_sold_off_platform` overload** (REQ-TRADE-02) —
  optional `(buyer_name, buyer_email, sale_price_sar)` params. When
  provided, atomically decrements the seller's shares (or soft-deletes
  the seller row if it hits zero), inserts a buyer row with
  `acquired_via='secondary_sale'` and the listing back-reference, writes
  a shareholder audit row. Backward-compatible: blank fields = v1
  behaviour (status flip only). Smoke 6/6.
- **`acquisition_models` + `compute_acquisition_model` RPC** (REQ-EXIT-01)
  — M&A scenario persistence with 5-model-per-workspace cap.
  `/acquisition` rewritten to list saved scenarios + new-scenario form
  + sortable results table (Shareholder / Shares / Payout / Multiple).
  `archive_acquisition_model` RPC for soft-delete. Smoke 4/4 + 14
  pgTAP assertions.
- **`seeking_type` first-class indexed column** (REQ-PART-01) — promoted
  from `type_data->>'seeking_type'` JSONB scan to an indexed column.
  Backfilled in the same migration. `create_connection_listing` RPC
  redeployed to write the column on insert. /connections browse query
  swapped to the new column.
- **`/messages/[inquiryId]` thread view + reply** — new
  `connection_inquiry_messages` table with both-parties RLS scoped to
  the inquiry; write blocked on closed/declined. Thread view UI with
  reply textarea (max 2000 chars). Inbox row links to the thread view;
  listing-detail page links back via "View thread →".
- **Context-aware eyebrow + subtitle on `/connections?seeking=…`** —
  Talents / Advisors / Co-founders / Business partners each get their
  own header copy, replacing the generic "INVESTMENT" eyebrow.
- **Equity-terms gating on partnership listings** — `equity_expectations`
  field gated behind "Request equity terms" card when viewer is not
  the owner and doesn't have an accepted inquiry. UI-only for v1.2;
  DB-level split deferred to v1.3.
- **User profile completeness** — new `user_profiles` table
  (`display_name`, `bio` ≤500 chars, `avatar_url`, `linkedin_url`,
  `location`). `/profile` reads it; new `/profile/edit` form for editing.
- **Settings depth** — real password change + email change (via
  `supabase.auth.updateUser`); date format + timezone preferences
  (persisted to `user_profiles`); per-type notification preferences
  (new `user_notification_preferences` table); plan/billing surface;
  KSA PDPL data export (full JSON dump) + 30-day deletion request
  (`account_deletion_requests` table). 2FA + active sessions shipped
  as "Coming soon" scaffolds (v1.3 P0).
- **Word-safe truncation helper** (`lib/text/truncate.ts`) +
  **gradient WorkspaceMark** component, both wired across rounds /
  marketplace / connections / messages card feeds.
- **Dilution validation** (`lib/cap-table/implied-dilution.ts`) —
  warn ≥30%, block >50% on round publish.
- **`/rounds`, `/marketplace`, `/connections` cross-workspace discovery
  feeds now exclude the user's own workspaces.** Filter pill counts
  rendered on every tab and chip.

### Changed

- **Sidebar workspace switcher** is now reliable — `switchWorkspace`
  accepts a `redirectTo` param so the user lands back on their current
  page after switching; double-click guard prevents racing transitions.
- **Sidebar expansion state** persists across navigations via
  `localStorage`.
- **`closeRound` server action** refactored to a phase-1-compute /
  phase-2-apply pattern that hands a precomputed plan to the new SQL
  RPC.
- **`audit_events.entity_type` CHECK + immutability trigger** extended
  to cover `financing_round`. Per-conversion shareholder audit rows stay
  mutable (matches the existing edit pattern).
- **CHANGELOG voice** — entries lead with "you can now…" rather than
  "refactored the…", aligning with the new sell-test rubric.

### Fixed

- **Audit timestamps** — investigated the audit's "universal timestamp"
  finding; confirmed it's a demo-seed artifact (single bulk insert on
  2026-05-15). Positive-control INSERTs get their own `created_at`. No
  code change.
- **`/profile` horizontal-duplication CSS bug** — `max-w-3xl` was being
  dropped by a wrapper. Fixed.

### Deferred to v1.3

- Real 2FA enrollment + active session list.
- Notification-preference enforcement in email delivery.
- DB-level split of `type_data` into public/private columns for the
  equity-terms gate.
- Account-deletion fulfilment cron (30-day scheduled job).
- Search across investor updates / term sheets / audit events.
- Sender-side notification on inquiry-message reply.
- OAuth providers (Google / LinkedIn / Apple).

## [0.2.0.0] - 2026-05-16

### Added

- **Connections Hub** — cross-workspace marketplace for whole-company exits
  and founder partnerships. Two listing types (`exit`, `partnership`) share
  one schema with type-specific structured fields in JSONB. Workspace-owned,
  cross-workspace readable. Browse + filter + manual "I'm interested" handshake.
- **Inquiry handshake flow** — one-step accept (owner accepts, both parties
  receive contact details + a scoped data-room signed token). Status panel
  on the listing detail page uses glass-refraction for sent / accepted /
  declined / closed states. Actor-constrained close: inquirer can only close
  an accepted inquiry; owner can close from sent or accepted.
- **Dashboard pulse tile** — "X open connections, Y new inquiries this week."
  Renders null when both counts are zero.
- **4 new email templates** in `lib/email/connections.ts` (inquiry-sent,
  inquiry-accepted-with-contact, inquiry-declined, listing-published) — all
  styled to match the existing investor-update / share-listing DNA (4px
  gradient top stripe, papyrus background, single primary CTA).
- **Sidebar entry** — "Connections" under the Investment group.
- **pgTAP RLS test suite** — 22 cases covering RLS isolation, RPC guards
  (self-inquiry, duplicate inquiry, non-owner accept, exit+partnership
  collision, audit immutability), and a REGRESSION test for the bidirectional
  collision between `create_share_listing` and an open exit listing.

### Changed

- **`create_share_listing` RPC** — added bidirectional collision guard. A
  workspace with an open exit `connection_listing` cannot create new
  `share_listings`. Whole-company sale supersedes individual share sales.
- **`audit_events` CHECK constraint + immutability trigger** — extended to
  cover `connection_listing` and `connection_inquiry` entity types. Audit
  rows for these entities are now immutable at the database level.
- **DESIGN.md** — §3.6 Connections Hub Listing Type Identity (magenta exits
  `#C73E9D`, lavender partnerships `#8A6FE8`, parallel to iSAFE green
  precedent). §8 Inquiry Status Chip semantics and Glass-card Status Panel
  component spec.

### Fixed

- **`data_room_links.token` default** — replaced `encode(..., 'base64url')`
  (Postgres 18+ only) with PG17-compatible URL-safe base64. The original
  default had never been exercised until Connections Hub started creating
  data_room_link rows on inquiry accept.

## [0.1.0] - 2026-05-15

Initial prototype: cap table, ESOP, governance, valuation, vault, traction,
investor updates, secondary share marketplace (Approach A bulletin board).
