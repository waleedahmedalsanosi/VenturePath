# VenturePath — User Stories & Acceptance Criteria

**Companion to:** `docs/prd-venturepath.md` §4.2 (user stories registry)
**Version:** Aligned with v0.3.0.0 (2026-05-17)
**Owner:** Waleed Alsanosi
**Format:** Gherkin-style (Given / When / Then). Each story carries persona,
intent, benefit, status, priority, and file anchors so an engineer can land
on the right code without rg.

---

## Reading guide

- **IDs** match the PRD: `US-S*` Startup, `US-I*` Investment, `US-T*` Trading,
  `US-E*` Exit, `US-P*` Partnership, `US-X*` Platform.
- **Status** is the ship state at v0.3.0.0. v1.3 candidates are tagged as
  "v1.3 P0/P1/P2".
- **Priority** is product priority for the current cycle (P1 = MVP, P2 =
  high-value v1.3, P3 = v2 candidate).
- **Acceptance Criteria** are testable conditions. Each AC must be
  independently verifiable. "Given / When / Then" format throughout.
- **Failure-mode ACs** are deliberately included (negative tests) — every
  story has at least one "rejects" or "blocks" criterion.

---

## 1. Startup Hub

### US-S01 — Create a workspace with company info

**As a** Founder (P1)
**I want to** create a workspace with company name, sector, country, founding year, funding stage, and one-liner
**So that** I have a single source of truth for my startup's identity
**Status:** Shipped v0.1.0 · **Priority:** P1
**File anchors:** `app/(app)/setup/`, `supabase/migrations/20260515000000_prototype_initial_schema.sql`

#### Acceptance Criteria

- **AC-1 (happy path):**
  Given I am a signed-in user with no workspace
  When I navigate to `/setup`, fill name + entity_status + country + city + sector + funding_stage + one_liner (≤140 chars), and submit
  Then a `workspaces` row is created with `owner_user_id = auth.uid()`
  And a `workspace_members` row with `role='owner'` is created in the same transaction
  And I am redirected to the dashboard for the new workspace.
- **AC-2 (validation):**
  Given I submit the form with `one_liner` > 140 characters
  Then the form rejects with a clear inline error
  And no `workspaces` row is created.
- **AC-3 (required fields):**
  Given any of {name, country, city, sector, funding_stage, one_liner} is empty
  Then the form rejects with that field highlighted.
- **AC-4 (multi-workspace):**
  Given I already own one workspace
  When I open the sidebar and click "+ New Startup"
  Then I can create a second workspace owned by me
  And it appears under "My Startup" in the sidebar.

### US-S02 — Invite members with role assignment

**As a** Founder (P1)
**I want to** invite team members and assign owner / admin / viewer roles
**So that** I can give my CFO access to cap table without giving them workspace-deletion power
**Status:** Shipped v0.1.0 · **Priority:** P1
**File anchors:** `app/(app)/members/`, `supabase/migrations/20260515120000_roles_and_access.sql`

#### Acceptance Criteria

- **AC-1 (invite by email):**
  Given I am the workspace owner
  When I enter an email and a role and submit
  Then a `workspace_invitations` row is created with a unique signed token
  And an invitation email is sent (Resend).
- **AC-2 (accept invitation):**
  Given an invitee clicks the invitation URL
  When the token is valid and not expired (7 days default)
  Then they are added to `workspace_members` with the invited role
  And the `workspace_invitations.accepted_at` is set.
- **AC-3 (reject duplicate):**
  Given an email already belongs to a workspace member
  When the owner re-invites them
  Then the action returns a clear error and no duplicate row is created.
- **AC-4 (role enforcement):**
  Given a member with role `viewer` attempts to mutate any workspace data
  Then RLS rejects the write.

### US-S03 — Track KSA compliance obligations

**As a** Founder (P1)
**I want to** track ZATCA / GAZT / MOC / SAMA compliance obligations with due dates
**So that** I never miss a filing
**Status:** Shipped v0.1.0 · **Priority:** P1
**File anchors:** `app/(app)/compliance/`, `supabase/migrations/20260515060000_compliance_schema.sql`

#### Acceptance Criteria

- **AC-1 (create obligation):**
  Given I am a workspace owner
  When I add an obligation with `name`, `regulatory_body`, `category`, `due_date`, and `recurrence`
  Then a `compliance_obligations` row is created
  And it appears on `/compliance` with its computed status (Complete / Overdue / Due Soon / Upcoming).
- **AC-2 (mark complete + recurrence):**
  Given an obligation has `recurrence='monthly'` and I mark it complete
  Then `completed_at` is set on the current row
  And a new obligation row is auto-created with the next month's `due_date` and `previous_id` set.
- **AC-3 (status computation):**
  Given `due_date < now()` and `completed_at IS NULL`
  Then the timeline renders the obligation as "Overdue" (status is computed at read time, never stored).
- **AC-4 (reminder window):**
  Given `due_date - now() ≤ reminder_days_before`
  Then the obligation renders as "Due Soon".

### US-S04 — Board meetings + resolutions

**As a** Founder (P1)
**I want to** schedule board meetings and store resolution templates
**So that** I have a paper trail aligned with KSA company law
**Status:** Shipped v0.1.0 · **Priority:** P1
**File anchors:** `app/(app)/governance/`, `supabase/migrations/20260515160000_governance_schema.sql`

#### Acceptance Criteria

- **AC-1 (create meeting):**
  Given I am a workspace owner
  When I create a board meeting with `title`, `meeting_at`, `format` (in-person / remote / hybrid), `agenda`
  Then a `board_meetings` row is created with `status='scheduled'`.
- **AC-2 (attach resolution):**
  Given a meeting exists
  When I create a resolution with a template (`round_approval` / `share_issue` / `option_grant` / `bylaw_change` / `custom`)
  Then a `resolutions` row is created with `meeting_id` set and `status='draft'`.
- **AC-3 (transition to decided):**
  Given a resolution is `draft`
  When the owner marks it decided and sets `decided_at` + `decided_by`
  Then the resolution becomes immutable (no further body edits).

### US-S05 — Document Vault with access tiers

**As a** Founder (P1)
**I want to** upload documents to a vault with intro / standard / diligence access tiers
**So that** I can share documents externally without granting workspace membership
**Status:** Shipped v0.1.0 · **Priority:** P1
**File anchors:** `app/(app)/vault/`, `supabase/migrations/20260515150000_vault_categories_visibility.sql`, `20260515220000_data_room_tiers.sql`

#### Acceptance Criteria

- **AC-1 (upload to category):**
  Given I am a workspace owner
  When I upload a file to a `vault_categories` row (e.g. Data Room)
  Then a `documents` row is created with `storage_path`, `size_bytes`, `mime_type`, and `data_room_tier`.
- **AC-2 (signed-token access):**
  Given a `data_room_links` row exists with `is_active=true` and `expires_at > now()`
  When an external party visits `/data-room/[token]`
  Then they see documents whose `data_room_tier` ≤ link's `access_tier`
  And the `view_count` increments.
- **AC-3 (revoke):**
  Given a workspace owner sets `is_active=false` on a `data_room_links` row
  Then any subsequent `/data-room/[token]` visit returns 404.
- **AC-4 (token expiry):**
  Given `expires_at < now()`
  Then `/data-room/[token]` returns 404 regardless of `is_active`.

### US-S06 — Monthly traction metrics

**As a** Founder (P1)
**I want to** record monthly traction metrics (MRR, customers, runway, gross margin)
**So that** I have a structured history for investor updates
**Status:** Shipped v0.1.0 · **Priority:** P1
**File anchors:** `app/(app)/traction/`, `supabase/migrations/20260515090000_traction_metrics_schema.sql`

#### Acceptance Criteria

- **AC-1 (insert metrics):**
  Given I am the workspace owner
  When I record `month` (first-of-month date), `mrr_sar`, `customer_count`, `gross_margin_pct`, `cash_runway_months`
  Then a `traction_metrics` row is created.
- **AC-2 (nullable fields):**
  Given I leave `gross_margin_pct` blank
  Then the row is created with that field NULL (all metrics nullable so partial months work).
- **AC-3 (publish toggles):**
  Given the workspace has `show_mrr_publicly=false`
  Then MRR is hidden on `/explore` for that workspace's public profile.

### US-S07 — Immutable audit trail

**As a** Founder (P1)
**I want to** see an immutable audit trail of every regulated state change
**So that** I can defend a regulator inquiry without scrambling
**Status:** Shipped v0.1.0 · **Priority:** P1
**File anchors:** `app/(app)/audit/`, `supabase/migrations/20260515080000_audit_events_schema.sql`, `20260516000003_audit_marketplace_immutable.sql`, `20260517120000_close_financing_round_rpc.sql`

#### Acceptance Criteria

- **AC-1 (insert visible):**
  Given an audit-logged action occurs (e.g. round close, listing accept)
  When I visit `/audit` for that workspace
  Then the event appears with `actor_email`, `entity_type`, `action`, `description`, `payload`, `created_at`.
- **AC-2 (UPDATE blocked at trigger):**
  Given an audit row has `entity_type IN ('share_listing', 'rofr_notification', 'connection_listing', 'connection_inquiry', 'financing_round')`
  When any role attempts `UPDATE audit_events SET description = '...' WHERE id = ...`
  Then the trigger raises `audit_events for marketplace entities are immutable`.
- **AC-3 (DELETE blocked at trigger):**
  Given the same set of entity types
  When any role attempts DELETE
  Then the trigger raises the same exception.
- **AC-4 (cross-workspace isolation):**
  Given two workspaces A and B with audit rows
  When user A queries `audit_events`
  Then RLS returns only workspace A's rows.

### US-S08 — User profile with display name + bio + avatar

**As a** any user
**I want to** have a real profile with display name, bio, avatar, LinkedIn, location
**So that** other VenturePath users see me as a person, not an email
**Status:** Shipped v0.3.0.0 · **Priority:** P1
**File anchors:** `app/(app)/profile/`, `app/(app)/profile/edit/`, `supabase/migrations/20260520000000_user_profiles.sql`

#### Acceptance Criteria

- **AC-1 (default fallback):**
  Given a user signs in for the first time and has no `user_profiles` row
  When they visit `/profile`
  Then the header shows the email local-part as display name + gradient initials as avatar.
- **AC-2 (edit and save):**
  Given a user opens `/profile/edit`
  When they save display_name, bio (≤500 chars), avatar_url, linkedin_url, location
  Then a `user_profiles` row is upserted
  And `/profile` reflects the new values on next render.
- **AC-3 (bio counter):**
  Given the user types in the bio field
  Then a live character counter renders, and submit is disabled at >500.
- **AC-4 (cross-workspace read):**
  Given any authenticated user
  When their server-side code queries `user_profiles` for any user_id
  Then RLS allows the read (forward-compat with v2 cross-workspace profile surfaces).

### US-S09 — Publish / unpublish company profile on /explore

**As a** Founder (P1)
**I want to** publish or unpublish my company profile from `/explore`
**So that** I control my market visibility
**Status:** Shipped v0.1.0 · **Priority:** P1
**File anchors:** `app/(app)/company/`, `app/explore/`, `supabase/migrations/20260515100000_public_profile.sql`

#### Acceptance Criteria

- **AC-1 (publish):**
  Given a workspace has `public_profile_published=false` and a valid `slug`
  When the owner toggles publish on
  Then `public_profile_published=true`
  And the workspace appears at `/explore/[slug]` for any visitor.
- **AC-2 (unpublish):**
  Given `public_profile_published=true`
  When the owner toggles off
  Then `/explore/[slug]` returns 404 for visitors.
- **AC-3 (missing slug):**
  Given the workspace has no `slug`
  Then the publish toggle is disabled with a hint.

---

## 2. Investment Hub

### US-I01 — Add shareholders with Sharia-compliant instruments

**As a** Founder (P1)
**I want to** add shareholders with iSAFE / SAFE / Convertible Note / Ordinary instruments
**So that** my cap table reflects every commitment
**Status:** Shipped v0.1.0 · **Priority:** P1
**File anchors:** `app/(app)/cap-table/`, `supabase/migrations/20260515000000_prototype_initial_schema.sql`, `20260515070000_add_safe_convertible.sql`

#### Acceptance Criteria

- **AC-1 (ordinary insert):**
  Given I am the workspace owner
  When I add a shareholder with `instrument_type='ordinary'` and instrument_data `{shares, price_per_share_sar}`
  Then a `shareholders` row is created
  And the cap-table totals (`/cap-table`) update.
- **AC-2 (iSAFE insert):**
  Given instrument_type='isafe'
  When instrument_data is `{investment_sar, valuation_cap_sar, profit_share_ratio, conversion_status:'unconverted'}`
  Then the row is created and renders with the permanent green iSAFE identity.
- **AC-3 (validation):**
  Given any required JSONB field is missing or non-numeric where numeric is required
  Then the form rejects.
- **AC-4 (RLS isolation):**
  Given two workspaces
  Then a member of A cannot SELECT shareholders from B (RLS).

### US-I02 — ESOP pool + grants with vesting

**As a** Founder (P1)
**I want to** issue ESOP grants with vesting schedules
**So that** I can compensate employees with equity Sharia-compliantly
**Status:** Shipped v0.1.0 · **Priority:** P1
**File anchors:** `app/(app)/esop/`, `supabase/migrations/20260515110000_esop_schema.sql`

#### Acceptance Criteria

- **AC-1 (pool creation):**
  Given the workspace has no `esop_pools` row
  When the owner creates one with `total_pool_shares` and `strike_price_reference_sar`
  Then the row is created.
- **AC-2 (grant):**
  Given a pool exists
  When the owner creates a grant with `employee_name`, `options_count`, `vesting_type`, `vesting_start_date`, `cliff_months`, `vesting_end_date`
  Then `esop_grants` row is created with `status='active'`.
- **AC-3 (vested % computed at read):**
  Given `grant_date + cliff_months ≤ today < vesting_end_date`
  Then the read-side render shows the linear vested percentage
  And the value is never stored.
- **AC-4 (termination):**
  Given a grant is `active`
  When the owner marks the employee terminated
  Then `status='terminated'` and the vested-at-termination snapshot is captured.

### US-I03 — Open a financing round

**As a** Founder (P1)
**I want to** open a financing round with target raise + pre-money
**So that** investors have a structured pipeline to land in
**Status:** Shipped v0.1.0 · **Priority:** P1
**File anchors:** `app/(app)/rounds/`, `supabase/migrations/20260515170000_financing_rounds.sql`

#### Acceptance Criteria

- **AC-1 (create draft):**
  Given I am the owner
  When I submit the round-creation form with `name`, `instrument_type`, `pre_money_valuation_sar`, `target_raise_sar`, `lead_investor`, `close_date`
  Then a `financing_rounds` row is created with `status='draft'`
  And a board resolution (`round_approval` template) is auto-created and linked via `board_resolution_id`.
- **AC-2 (draft → open):**
  Given a round is `draft`
  When the owner opens it
  Then `status='open'`.
- **AC-3 (auto-promote on close):**
  Given a round has signed term sheets
  When the owner closes it
  Then signed-term-sheet investors are inserted as shareholders in the same transaction (see US-I06).

### US-I04 — Investor pipeline

**As a** Founder (P1)
**I want to** track investor pipeline per round (prospect / contacted / in_discussion / term_sheet / passed / invested)
**So that** I can manage 30 investors without losing context
**Status:** Shipped v0.1.0 · **Priority:** P1
**File anchors:** `app/(app)/rounds/[id]/`, `supabase/migrations/20260515200000_pipeline_enhancements.sql`

#### Acceptance Criteria

- **AC-1 (add prospect):**
  Given an open round
  When I add a pipeline contact with `name`, `email`, `firm`, `ticket_size_sar`
  Then an `investor_pipeline` row is created with `status='prospect'`.
- **AC-2 (status transitions):**
  Given a contact's status is `prospect`
  When the owner updates to any of `{contacted, in_discussion, term_sheet, passed, invested}`
  Then the change is persisted.
- **AC-3 (hot flag):**
  Given a contact has `is_hot=true`
  Then they render with visual emphasis in the pipeline view.

### US-I05 — Term sheets per investor

**As a** Founder (P1)
**I want to** generate term sheets per investor and track sent / signed / declined status
**So that** round close auto-promotes signed term sheets
**Status:** Shipped v0.1.0 · **Priority:** P1
**File anchors:** `app/(app)/term-sheets/`, `supabase/migrations/20260515230000_term_sheets.sql`

#### Acceptance Criteria

- **AC-1 (create):**
  Given an open round
  When the owner creates a term sheet with `investor_name`, `instrument_type`, and `terms` JSONB
  Then a `term_sheets` row is created with `status='draft'`, `version=1`.
- **AC-2 (sent / signed / declined / withdrawn):**
  Given a draft term sheet
  When the owner transitions through statuses
  Then `sent_at` and `signed_at` are stamped appropriately.
- **AC-3 (auto-promotion on round close):**
  Given a term sheet has `status='signed'` when the round is closed
  Then a shareholder row is auto-created for that investor (see US-I06 AC-3).

### US-I06 — Atomic round close with auto-conversion

**As a** Founder (P1)
**I want to** close a round and have iSAFE / SAFE / CN holders auto-convert to ordinary in one atomic transaction
**So that** mid-flight failure cannot leave my cap table half-converted
**Status:** Shipped v0.3.0.0 (REQ-INV-01) · **Priority:** P1
**File anchors:** `app/(app)/rounds/actions.ts` (`closeRound`), `supabase/migrations/20260517120000_close_financing_round_rpc.sql`, `supabase/tests/close_financing_round.sql`

#### Acceptance Criteria

- **AC-1 (happy path):**
  Given a round is `open` with N convertible holders (iSAFE/SAFE) and M signed term sheets
  When the owner submits the close form with `pre_money_valuation_sar`, `fd_shares_pre_round`, `actual_raise_sar`
  Then a single `close_financing_round` RPC call:
    a) inserts M promoted shareholders,
    b) inserts N new ordinary rows for converted holders,
    c) marks the N originals as `conversion_status='converted'`,
    d) sets round `status='closed'` with the close terms,
    e) writes per-conversion audit rows (`entity_type='shareholder'`),
    f) writes the round-close audit row (`entity_type='financing_round'`, immutable).
- **AC-2 (atomicity):**
  Given any step inside the RPC raises
  Then the entire transaction rolls back
  And the round status remains `open`
  And no orphan shareholders or partial audit rows exist.
- **AC-3 (FOR UPDATE lock):**
  Given two concurrent close requests for the same round
  Then only one succeeds; the other receives the round-already-closed error.
- **AC-4 (non-owner rejected):**
  Given a non-owner workspace member calls the RPC
  Then it raises `only the workspace owner can close a financing round`.
- **AC-5 (round-close audit immutability):**
  Given the round-close audit row was written
  When any role attempts UPDATE / DELETE on it
  Then the immutability trigger raises (verified by US-S07 AC-2 / AC-3).
- **AC-6 (math via TS, not plpgsql):**
  Given the RPC body inspects the conversion plan
  Then it does NOT recompute share counts in SQL
  And the TS-supplied `new_shares` value is what lands in `instrument_data`.

### US-I07 — Publish round to cross-workspace browse (REQ-INV-02)

**As a** Founder (P1)
**I want to** make my round discoverable to other VenturePath investors with a one-click toggle
**So that** cross-workspace investors can find me without me having to email them
**Status:** Shipped v0.3.0.0 · **Priority:** P1
**File anchors:** `app/(app)/rounds/new/form.tsx`, `app/(app)/rounds/[id]/visibility-toggle.tsx`, `app/(app)/rounds/actions.ts` (`setRoundVisibility`)

#### Acceptance Criteria

- **AC-1 (toggle from creation):**
  Given I open `/rounds/new`
  When I check "Make this round discoverable…" and submit
  Then the new row's `is_public=true`.
- **AC-2 (toggle from management view):**
  Given an open round with `is_public=false`
  When I flip the toggle on the management view
  Then `setRoundVisibility` fires immediately (no Save button)
  And the toggle visually flips optimistically
  And the audit row writes `entity_type='financing_round', action='visibility_changed', payload={from:false, to:true}`.
- **AC-3 (revalidation):**
  Given a toggle flip
  Then `revalidatePath` clears `/rounds`, `/rounds/[id]`, and `/explore` caches.
- **AC-4 (dilution block — see US-I08):**
  Given the implied dilution > 50%
  Then the publish toggle is disabled with a hint citing the block.

### US-I08 — Dilution validation on round publish

**As a** Founder (P1)
**I want to** be warned (≥30%) or blocked (>50%) when implied single-round dilution looks like a typo
**So that** I don't publicly broadcast 60% dilution because I forgot a zero on pre-money
**Status:** Shipped v0.3.0.0 · **Priority:** P1
**File anchors:** `lib/cap-table/implied-dilution.ts`, `lib/cap-table/implied-dilution.test.ts`, `app/(app)/rounds/new/form.tsx`

#### Acceptance Criteria

- **AC-1 (warn band):**
  Given `target_raise / (pre_money + target_raise) ≥ 0.30 AND ≤ 0.50`
  Then the form shows an amber warning banner
  And submit remains enabled.
- **AC-2 (block band):**
  Given the ratio > 0.50
  Then the form shows a red block banner
  And the submit button is disabled.
- **AC-3 (publish-time defense):**
  Given the user bypasses the form and calls `setRoundVisibility(roundId, true)` directly
  And the round's implied dilution > 50%
  Then the server action rejects.
- **AC-4 (null pre-money safe):**
  Given pre-money or target_raise is NULL
  Then the verdict is `ok` (no false-positive warning).

### US-I09 — Browse public open rounds cross-workspace

**As an** Investor (P8)
**I want to** browse open rounds across every VenturePath workspace that opted in
**So that** I find KSA deals I'd never see otherwise
**Status:** Shipped v1.1 / hardened v0.3.0.0 · **Priority:** P1
**File anchors:** `app/(app)/rounds/page.tsx`, `app/(app)/rounds/browse-view.tsx`, `app/(app)/rounds/tabs.tsx`

#### Acceptance Criteria

- **AC-1 (only public open):**
  Given I visit `/rounds` (Open tab)
  Then I see only rounds where `status='open' AND is_public=true AND deleted_at IS NULL`.
- **AC-2 (exclude own):**
  Given the signed-in user owns workspace W
  Then rounds where `workspace_id = W` are NOT in the Open tab.
- **AC-3 (count badge):**
  Given there are N matching rounds
  Then the "Open rounds" tab shows `N` next to the label
  And the "My rounds" tab shows the count of own rounds.
- **AC-4 (CTA when empty):**
  Given the user has at least one open round with `is_public=false`
  And the Open tab is empty
  Then a contextual CTA "You have an open round. Make it discoverable →" links to that round's page.

### US-I10 — Investor updates with per-recipient open tracking (REQ-INV-03)

**As a** Founder (P1)
**I want to** send an investor update with per-recipient open tracking
**So that** I know who's reading and can re-send only to the unopened
**Status:** Shipped v0.3.0.0 · **Priority:** P1
**File anchors:** `app/(app)/rounds/[id]/update-actions.ts`, `app/(app)/investor-updates/[id]/recipients-section.tsx`, `app/updates/[token]/page.tsx`, `supabase/migrations/20260519100000_investor_update_recipients.sql`

#### Acceptance Criteria

- **AC-1 (per-recipient insert on send):**
  Given a draft `investor_updates` row with N recipient emails
  When the owner publishes it
  Then N `investor_update_recipients` rows are upserted with `sent_at=now()` and `resend_message_id` from the Resend response.
- **AC-2 (unique constraint):**
  Given a re-send to the same `(update_id, email)` pair
  Then the row is upserted (sent_at updated), not duplicated.
- **AC-3 (open tracking):**
  Given a recipient clicks the email URL `/updates/[token]?r=<encoded-email>`
  Then `opened_at = now()` is set on the matching recipient row (NULL-guarded so re-opens don't overwrite).
- **AC-4 (resend-to-unopened):**
  Given the owner clicks "Re-send to unopened"
  Then only recipients with `opened_at IS NULL` receive a fresh email
  And their `sent_at` is updated.
- **AC-5 (anonymous view count preserved):**
  Given a recipient visits the URL
  Then `investor_update_views` also gets a row (unchanged from v1).

### US-I11 — Dilution scenario modeling

**As a** Founder (P1)
**I want to** model dilution scenarios before publishing a round
**So that** I don't get surprised by the post-money cap table
**Status:** Shipped v0.1.0 · **Priority:** P1
**File anchors:** `app/(app)/dilution/`

#### Acceptance Criteria

- **AC-1 (input → output):**
  Given inputs `pre_money_valuation_sar`, `target_raise_sar`, and current cap table
  Then the modeler renders post-money cap table with each shareholder's new % and absolute share count.
- **AC-2 (warn banner for ≥30%):**
  Given implied dilution ≥ 30%
  Then a warning banner appears (consistency with US-I08 AC-1).

### US-I12 — Liquidation waterfall modeling

**As a** Founder (P2)
**I want to** model liquidation waterfalls per instrument class
**So that** I know what each investor actually gets at exit
**Status:** Shipped v0.1.0 · **Priority:** P1
**File anchors:** `app/(app)/waterfall/`

#### Acceptance Criteria

- **AC-1 (preferred-first distribution):**
  Given an exit valuation and current cap table
  Then preferred holders receive their liquidation preference first (1× non-participating in v1)
  And remaining proceeds distribute pro-rata across ordinary holders.
- **AC-2 (multiple computation):**
  Then each holder's effective multiple is `payout / cost_basis` when cost_basis > 0
  Else NULL.

### US-I13 — Save and compare M&A scenarios (REQ-EXIT-01)

**As a** Founder (P2)
**I want to** save and compare M&A scenarios with per-shareholder payouts
**So that** I can negotiate from a position of knowing the math
**Status:** Shipped v0.3.0.0 · **Priority:** P1
**File anchors:** `app/(app)/acquisition/`, `supabase/migrations/20260519300000_acquisition_models.sql`, `supabase/tests/acquisition_models.sql`

#### Acceptance Criteria

- **AC-1 (create scenario):**
  Given the owner submits the form with `label`, `acquisition_price_sar`, `debt_sar`
  Then `compute_acquisition_model` RPC creates an `acquisition_models` row + N `acquisition_model_results` rows (one per shareholder).
- **AC-2 (5-scenario cap):**
  Given the workspace already has 5 active (non-deleted) acquisition models
  When a 6th is attempted
  Then the RPC raises `Maximum 5 acquisition models per workspace. Archive one to create a new model.`
- **AC-3 (archive):**
  Given a scenario exists
  When the owner archives it
  Then `deleted_at = now()` is set and the slot is freed.
- **AC-4 (attach to exit listing):**
  Given the workspace has an open exit `connection_listing`
  When the owner attaches a model
  Then `connection_listing_id` is set on the model.
- **AC-5 (non-owner rejected):**
  Given a non-owner calls the RPC
  Then it raises with a clear error.

---

## 3. Trading Hub

### US-T01 — Post a secondary share listing

**As an** Existing shareholder (P6)
**I want to** post a secondary ask with shares + ask price + optional notes
**So that** I have a posted-ask bulletin board instead of WhatsApp negotiation
**Status:** Shipped v0.1.0 · **Priority:** P1
**File anchors:** `app/(app)/marketplace/new/`, `supabase/migrations/20260516000000_share_listings.sql`

#### Acceptance Criteria

- **AC-1 (insert):**
  Given a workspace owner picks a shareholder and submits `shares_offered`, `ask_price_sar`, optional `notes` and `expires_at`
  Then a `share_listings` row is created with `status='open'`, `is_public=false`.
- **AC-2 (collision — open exit blocks):**
  Given the workspace has an open `connection_listings` of type 'exit'
  When a share listing is attempted
  Then the create RPC raises `cannot create share listing while open exit listing exists` (the bidirectional collision from connections-hub).
- **AC-3 (validation):**
  Given `shares_offered` ≤ 0 or `ask_price_sar` ≤ 0
  Then the form rejects.

### US-T02 — ROFR notifications on new listing

**As an** Existing shareholder (P6)
**I want to** trigger ROFR notifications to other shareholders automatically
**So that** I don't bypass their right of first refusal
**Status:** Shipped v0.1.0 · **Priority:** P1
**File anchors:** `app/(app)/marketplace/[id]/`, `supabase/migrations/20260516000001_rofr_notifications.sql`, `20260516000002_marketplace_rpcs.sql`

#### Acceptance Criteria

- **AC-1 (auto-notify on create):**
  Given a share listing is created
  Then a `rofr_notifications` row is created for each other ordinary shareholder
  And an email is dispatched to each notified shareholder.
- **AC-2 (window):**
  Given a notification is created
  Then `window_expires_at` is set per the configured ROFR window length.
- **AC-3 (response):**
  Given a notified shareholder records `response='exercise'` or `'decline'`
  Then `responded_at` and `responded_by_user_id` are stamped.
- **AC-4 (response immutability):**
  Given a notification has `response` already set
  Then subsequent response attempts are rejected.

### US-T03 — Publish listing cross-workspace (REQ-TRADE-01)

**As an** Existing shareholder (P6)
**I want to** make my listing visible to all VenturePath members with one click
**So that** buyers across workspaces can find me
**Status:** Shipped v0.3.0.0 · **Priority:** P1
**File anchors:** `app/(app)/marketplace/[id]/visibility-toggle.tsx`, `app/(app)/marketplace/actions.ts` (`setListingVisibility`)

#### Acceptance Criteria

- **AC-1 (toggle):**
  Given a listing is `open` AND there is no active ROFR window (see US-T04)
  When the owner toggles `is_public` on
  Then `share_listings.is_public=true`
  And the audit row writes `entity_type='share_listing', action='visibility_changed', payload={from, to}`.
- **AC-2 (Browse appearance):**
  Given `is_public=true AND status='open'`
  Then the listing appears on `/marketplace` Browse cross-workspace.
- **AC-3 (creation form default OFF):**
  Given a new listing form
  Then `is_public` defaults to false.

### US-T04 — ROFR-gate on cross-workspace publish

**As an** Existing shareholder (P6)
**I want to** be prevented from making a listing public while an ROFR window is still open
**So that** the ROFR mechanism stays meaningful
**Status:** Shipped v0.3.0.0 · **Priority:** P1
**File anchors:** `app/(app)/marketplace/actions.ts`, `app/(app)/marketplace/[id]/visibility-toggle.tsx`

#### Acceptance Criteria

- **AC-1 (UI disabled state):**
  Given any `rofr_notifications` row for this listing has `response IS NULL AND window_expires_at > now()`
  Then the toggle is disabled
  And a tooltip shows "ROFR window closes on {date}. You can make this listing public after that."
- **AC-2 (server-side defense):**
  Given the UI gate is bypassed and the action is called directly with `isPublic=true`
  Then the server action queries `rofr_notifications`
  And rejects with `ROFR window is still open until {date}`.
- **AC-3 (passes after window):**
  Given the ROFR window has expired
  Then the toggle is enabled and works normally.

### US-T05 — Transfer-agent cap-table sync on mark-sold (REQ-TRADE-02)

**As a** Founder (P1)
**I want to** mark a listing sold off-platform with optional buyer details
**So that** my cap table updates automatically — buyer appears, seller's count drops
**Status:** Shipped v0.3.0.0 · **Priority:** P1
**File anchors:** `app/(app)/marketplace/[id]/listing-actions.tsx`, `app/(app)/marketplace/actions.ts`, `supabase/migrations/20260519200000_transfer_agent_cap_table_sync.sql`, `supabase/tests/transfer_agent_cap_table.sql`

#### Acceptance Criteria

- **AC-1 (backward compatible, no buyer):**
  Given the form is submitted without buyer fields
  Then the listing flips to `status='sold_off_platform'`
  And no cap-table mutation occurs
  And the RPC returns `{cap_table_updated: false, new_shareholder_id: null}`.
- **AC-2 (with buyer, partial sell-down):**
  Given the seller has more shares than `shares_offered`
  When the owner provides buyer_name + buyer_email + sale_price_sar
  Then the seller's `instrument_data->>'shares'` decrements by `shares_offered`
  And a new shareholder row for the buyer is inserted with `acquired_via='secondary_sale'` + `listing_id` back-reference + price-per-share derived from sale price
  And a shareholder audit row is written with `action='secondary_sale_recorded'`.
- **AC-3 (with buyer, full sell-down):**
  Given the seller has exactly `shares_offered` shares
  Then the seller row is soft-deleted (`deleted_at=now()`)
  And the buyer row is inserted (unchanged from AC-2).
- **AC-4 (under-shared rejection):**
  Given the seller has FEWER shares than `shares_offered`
  Then the RPC raises `seller does not have enough shares (has X, listing offers Y)`.
- **AC-5 (already sold rejection):**
  Given the listing is already `sold_off_platform`
  Then the RPC raises `listing is sold_off_platform — cannot mark sold`.
- **AC-6 (non-owner rejection):**
  Given the caller is not the workspace owner
  Then the RPC raises `only the workspace owner can mark a listing as sold`.
- **AC-7 (confirmation step UI):**
  Given the owner clicks "Mark sold" with buyer details filled
  Then a confirmation modal renders: "This will update your cap table and cannot be undone."

### US-T06 — Browse co-located secondaries + exits

**As a** Buyer (P8)
**I want to** browse public secondary listings + exit listings co-located
**So that** I have one place to find KSA equity opportunities
**Status:** Shipped v1.1 / hardened v0.3.0.0 · **Priority:** P1
**File anchors:** `app/(app)/marketplace/page.tsx`, `app/(app)/marketplace/browse-view.tsx`

#### Acceptance Criteria

- **AC-1 (two sections):**
  Given visiting `/marketplace` (Browse tab)
  Then two sections render: "Secondary share listings" and "Companies open to exit".
- **AC-2 (exclude own):**
  Given the user owns workspace W
  Then listings where `workspace_id = W` are excluded from both sections.
- **AC-3 (counts in section headers):**
  Then each section shows the count next to its heading.
- **AC-4 (empty-state CTA):**
  Given both sections are empty
  And the user has a private listing in their workspace
  Then the empty state shows a contextual CTA linking to that listing.

### US-T07 — Withdraw a listing

**As an** Existing shareholder (P6)
**I want to** withdraw a listing if the deal falls through
**So that** the browse view stays accurate
**Status:** Shipped v0.1.0 · **Priority:** P1
**File anchors:** `app/(app)/marketplace/actions.ts`, `withdraw_share_listing` RPC

#### Acceptance Criteria

- **AC-1 (withdraw):**
  Given an `open` listing
  When the owner withdraws it
  Then `status='withdrawn'`, `closed_at=now()`, `closed_reason` is set if provided.
- **AC-2 (no longer surfaces):**
  Then the listing no longer appears on `/marketplace` Browse (only `status='open'` listings do).

---

## 4. Exit Hub

### US-E01 — Create exit listing

**As a** Founder, exit-seeking (P4)
**I want to** list my company for exit with structured ask details (sale / open-to-offers / acqui-hire / merger)
**So that** acquirers find me without me hiring a broker
**Status:** Shipped v0.2.0.0 · **Priority:** P1
**File anchors:** `app/(app)/connections/new/`, `supabase/migrations/20260516000004_connections_hub.sql`

#### Acceptance Criteria

- **AC-1 (insert):**
  Given the form is submitted with `listing_type='exit'`, `public_summary` (≤500 chars), `type_data` including `ask_type`, optional `ask_amount_sar`, optional `sector`, optional `stage`
  Then a `connection_listings` row is created with `status='open'`.
- **AC-2 (collision — open share_listings block):**
  Given the workspace has any open `share_listings`
  Then the RPC raises `cannot create exit listing while open share listings exist`.
- **AC-3 (collision — open partnership block):**
  Given the workspace has an open partnership listing
  Then the RPC raises (type collision).
- **AC-4 (uniqueness):**
  Given the workspace already has an open exit listing
  Then a second one is rejected.

### US-E02 — Exit listing cross-workspace visible

**As a** Founder, exit-seeking (P4)
**I want to** have inquirers see my listing across every VenturePath workspace
**So that** maximum buyer pool
**Status:** Shipped v0.2.0.0 · **Priority:** P1
**File anchors:** `app/(app)/connections/page.tsx`, `app/(app)/marketplace/page.tsx`

#### Acceptance Criteria

- **AC-1 (browse appears):**
  Given an exit listing with `status='open' AND deleted_at IS NULL`
  Then it appears on `/connections?filter=exit` for any authenticated user with at least one workspace.
- **AC-2 (RLS):**
  Given a user with NO workspaces
  Then the cross-workspace browse returns 0 rows.

### US-E03 — Send inquiry on exit listing

**As an** Acquirer (P7)
**I want to** send a structured inquiry on an exit listing
**So that** the seller can accept/decline without bouncing to email
**Status:** Shipped v0.2.0.0 · **Priority:** P1
**File anchors:** `app/(app)/connections/[id]/inquiry-cta.tsx`, `send_connection_inquiry` RPC

#### Acceptance Criteria

- **AC-1 (send):**
  Given an open exit listing
  When the inquirer submits with optional message (≤500 chars)
  Then a `connection_inquiries` row is created with `status='sent'`.
- **AC-2 (self-inquiry rejected):**
  Given the inquirer's workspace IS the listing's workspace
  Then the RPC raises.
- **AC-3 (duplicate live inquiry rejected):**
  Given the inquirer already has a live (`sent` or `accepted`) inquiry on this listing
  Then the RPC raises (unique partial index).

### US-E04 — Receive data-room token on accept

**As an** Acquirer (P7)
**I want to** receive a signed data-room token on inquiry accept
**So that** I can do scoped due diligence without joining the seller's workspace
**Status:** Shipped v0.2.0.0 · **Priority:** P1
**File anchors:** `accept_connection_inquiry` RPC, `lib/email/connections.ts`

#### Acceptance Criteria

- **AC-1 (accept mints token):**
  Given the listing owner accepts an inquiry
  Then a `data_room_links` row is minted with `access_tier` (intro/standard/diligence) and `expires_at`.
- **AC-2 (acceptance email contains contact + token URL):**
  Then the inquirer receives an email with the listing owner's contact details AND a signed URL `/data-room/[token]`.
- **AC-3 (token TTL):**
  Given default `p_token_ttl_days=14`
  Then `expires_at = now() + 14 days`.
  Given `p_token_ttl_days > 90`
  Then the RPC clamps to 90.
- **AC-4 (race protection):**
  Given two concurrent accept calls
  Then `FOR UPDATE` allows only one to succeed; the other raises `already accepted`.

### US-E05 — Exit + secondary mutual exclusion

**As a** Founder, exit-seeking (P4)
**I want to** be blocked from having both an exit listing and open secondary listings simultaneously
**So that** the market gets one clear signal about my workspace's intent
**Status:** Shipped v0.2.0.0 · **Priority:** P1
**File anchors:** `create_connection_listing` + `create_share_listing` RPCs

#### Acceptance Criteria

- **AC-1 (exit → share):**
  Given an open exit listing
  When a share listing is attempted in the same workspace
  Then the share-listing RPC raises (bidirectional REGRESSION test in `supabase/tests/connections_rls.sql`).
- **AC-2 (share → exit):**
  Given any open share listing
  When an exit listing is attempted in the same workspace
  Then the connection RPC raises.

### US-E06 — Attach M&A model to exit listing

**As a** Founder, exit-seeking (P4)
**I want to** save M&A modelled scenarios and optionally attach one to my exit listing
**So that** inquirers see my modelled outcome at the asking price
**Status:** Shipped v0.3.0.0 · **Priority:** P1
**File anchors:** `app/(app)/acquisition/`, see US-I13

#### Acceptance Criteria

- **AC-1 (attach):**
  Given the workspace has an open exit listing and an `acquisition_models` row
  When the owner attaches the model
  Then `acquisition_models.connection_listing_id` is set.
- **AC-2 (detach via archive):**
  Given the model is archived
  Then it no longer surfaces on the listing.

### US-E07 — Withdraw exit listing

**As a** Founder (P1, P4)
**I want to** withdraw an exit listing without consequence
**So that** I can reverse course if my situation changes
**Status:** Shipped v0.2.0.0 · **Priority:** P1
**File anchors:** `withdraw_connection_listing` RPC

#### Acceptance Criteria

- **AC-1 (withdraw):**
  Given an open exit listing
  When the owner withdraws it
  Then `status='withdrawn'`, `closed_at`, `closed_reason` are set.
- **AC-2 (subsequent share listing allowed):**
  Then the workspace can now post a share listing (US-T01).

---

## 5. Partnership Hub

### US-P01 — Create partnership listing

**As a** Founder, partnership-seeking (P3)
**I want to** list a partnership opportunity with structured fields
**So that** candidates self-filter by fit
**Status:** Shipped v0.2.0.0 · **Priority:** P1
**File anchors:** `app/(app)/connections/new/form.tsx`

#### Acceptance Criteria

- **AC-1 (insert):**
  Given the form is submitted with `listing_type='partnership'`, `public_summary` (≤500 chars), `type_data` including `seeking_type` (one of `co_founder|advisor|senior_hire|business_partner`), `skills[]` (≤10), `commitment_type`, optional `equity_expectations` (≤200 chars)
  Then a `connection_listings` row is created
  And the `seeking_type` column is also populated (see US-P04).
- **AC-2 (invalid seeking_type rejected):**
  Given `seeking_type` is not in the allowed enum
  Then the RPC raises `invalid seeking_type`.
- **AC-3 (mutual exclusion with exit):**
  Given an open exit listing in the workspace
  Then the partnership listing is rejected (see US-P03).

### US-P02 — Partnership listing cross-workspace visible

**As a** Founder, partnership-seeking (P3)
**I want to** have my listing discoverable cross-workspace
**So that** talent / advisors find me without me cold-DMing on LinkedIn
**Status:** Shipped v0.2.0.0 · **Priority:** P1

#### Acceptance Criteria

- **AC-1 (appears in browse):**
  Given an open partnership listing
  Then it appears on `/connections?filter=partnership` for any signed-in user with at least one workspace.

### US-P03 — Partnership ↔ exit mutual exclusion

**As a** Founder, partnership-seeking (P3)
**I want to** be blocked from having a partnership listing AND an exit listing simultaneously
**So that** market doesn't get confused about my intent
**Status:** Shipped v0.2.0.0 · **Priority:** P1
**File anchors:** `create_connection_listing` RPC

#### Acceptance Criteria

- **AC-1 (partnership → exit):**
  Given an open partnership listing
  When an exit listing is attempted in the same workspace
  Then the RPC raises.
- **AC-2 (exit → partnership):**
  Given an open exit listing
  When a partnership listing is attempted
  Then the RPC raises.

### US-P04 — Talents / Advisors filter via indexed column (REQ-PART-01)

**As an** Operator (P5)
**I want to** browse partnership listings filtered by senior_hire / advisor / co_founder / business_partner
**So that** I see only listings that match my role
**Status:** Shipped v1.1 (filter) / v0.3.0.0 (indexed column) · **Priority:** P1
**File anchors:** `app/(app)/connections/page.tsx`, `supabase/migrations/20260519400000_seeking_type_column.sql`

#### Acceptance Criteria

- **AC-1 (deep link):**
  Given visiting `/connections?seeking=senior_hire`
  Then only partnership listings where `seeking_type='senior_hire'` render.
- **AC-2 (sidebar entries):**
  Then "Talents" sidebar item → `?seeking=senior_hire`; "Advisors" → `?seeking=advisor`.
- **AC-3 (backfill parity):**
  Given the column exists post-migration
  Then row counts for `seeking_type IS NOT NULL` match counts for `type_data->>'seeking_type' IS NOT NULL` (backfill verified).
- **AC-4 (RPC writes column on insert):**
  Given a new partnership listing is created via `create_connection_listing`
  Then both `type_data->>'seeking_type'` AND `seeking_type` column are populated.

### US-P05 — Equity-terms gating (audit item #10)

**As a** Founder, partnership-seeking (P3)
**I want to** have my `equity_expectations` field gated behind "request to view"
**So that** my negotiating terms aren't broadcast to every signed-in user
**Status:** Shipped v0.3.0.0 (UI gate); v1.3 P1 (DB-level split) · **Priority:** P1
**File anchors:** `app/(app)/connections/[id]/equity-gate.tsx`, `app/(app)/connections/[id]/detail-view.tsx`, `app/(app)/connections/[id]/page.tsx`

#### Acceptance Criteria

- **AC-1 (owner sees terms):**
  Given the viewer IS the listing owner
  Then the equity_expectations text renders inline (no gate).
- **AC-2 (accepted inquirer sees terms):**
  Given the viewer has an inquiry on this listing with `status='accepted'`
  Then the equity_expectations text renders inline.
- **AC-3 (gated for everyone else):**
  Given the viewer is neither owner nor accepted inquirer
  Then a lock-icon card renders with "Request equity terms" CTA.
- **AC-4 (pending state):**
  Given the viewer has an inquiry with `status='sent'`
  Then the card renders "Pending — terms will reveal once your inquiry is accepted".
- **AC-5 (request fires send_connection_inquiry):**
  Given the viewer clicks "Request equity terms"
  Then the existing `send_connection_inquiry` RPC is fired (no new RPC, no second mechanism).
- **AC-6 (v1.3 known limitation):**
  Given a determined attacker queries `connection_listings` directly with `SELECT type_data->>'equity_expectations'`
  Then they CAN see the field (UI gate only; v1.3 P1 splits the JSONB column to close).

### US-P06 — "Request equity terms" uses standard inquiry flow

**As an** Operator (P5)
**I want to** click "Request equity terms" and have it fire the standard inquiry flow
**So that** I don't have to learn a new mechanism per field
**Status:** Shipped v0.3.0.0 · **Priority:** P1

#### Acceptance Criteria

- **AC-1 (no separate state):**
  Given the click fires `send_connection_inquiry`
  Then there is no separate `equity_terms_requests` table
  And no separate review queue.
- **AC-2 (visible in messages inbox):**
  Then the resulting inquiry shows up in `/messages` like any other inquiry.

### US-P07 — Context-aware eyebrow + subtitle per seeking variant (audit item #12)

**As an** Operator (P5)
**I want to** see a partnership listing page with eyebrow / subtitle specific to my role
**So that** the product talks to my use case
**Status:** Shipped v0.3.0.0 · **Priority:** P1
**File anchors:** `app/(app)/connections/browse.tsx`, `lib/i18n/locales/{en,ar}/connections.json`

#### Acceptance Criteria

- **AC-1 (Talents header):**
  Given `?seeking=senior_hire`
  Then eyebrow = "Talents", subtitle = "Senior hires open to joining KSA startups."
- **AC-2 (Advisors header):**
  Given `?seeking=advisor`
  Then eyebrow = "Advisors", subtitle = "Industry experts available for advisory engagements."
- **AC-3 (Co-founders header):**
  Given `?seeking=co_founder`
  Then eyebrow = "Co-founders", subtitle = "Founders open to joining a co-founder team."
- **AC-4 (Business partners header):**
  Given `?seeking=business_partner`
  Then eyebrow = "Business partners", subtitle = "Operators open to commercial partnerships."
- **AC-5 (default):**
  Given no `seeking` param
  Then eyebrow = "Connections" (NOT "Investment"), subtitle = unchanged default.

### US-P08 — Send inquiry on partnership listing

**As an** Operator (P5)
**I want to** send an inquiry on a partnership listing
**So that** the founder can accept and start a conversation
**Status:** Shipped v0.2.0.0 · **Priority:** P1

#### Acceptance Criteria

- **AC-1:** Same handshake mechanics as US-E03 (one-step accept, contact reveal, data-room token if vault is published).

---

## 6. Platform Layer

### US-X01 — Bilingual EN/AR + full RTL

**As any** user
**I want to** use the product in either English or Arabic with full RTL
**So that** KSA-first means Arabic-first, not Arabic-bolt-on
**Status:** Shipped v0.2.0.0 / hardened v1.1 · **Priority:** P1
**File anchors:** `lib/i18n/I18nProvider.tsx`, `lib/i18n/locales/{en,ar}/*.json`

#### Acceptance Criteria

- **AC-1 (toggle):**
  Given the user clicks "AR" in the header
  Then `<html lang="ar" dir="rtl">` is set
  And every surface re-renders in Arabic with RTL layout.
- **AC-2 (logical properties):**
  Given the user is in RTL mode
  Then all spacing / borders / alignment uses logical properties (`start`/`end`, `ps-`/`pe-`)
  And no element mirrors incorrectly.
- **AC-3 (Cairo font):**
  Given the user is in Arabic mode
  Then text renders in Cairo font; Latin numbers stay tabular-nums.

### US-X02 — Multi-workspace switching

**As any** user
**I want to** own multiple workspaces and switch between them in the sidebar
**So that** founders running two startups don't manage two accounts
**Status:** Shipped v1.1 / hardened v0.3.0.0 · **Priority:** P1
**File anchors:** `app/(app)/components/sidebar.tsx`, `app/(app)/components/workspace-actions.ts`, `lib/workspace/active.ts`

#### Acceptance Criteria

- **AC-1 (switch keeps page):**
  Given I am on `/rounds` in workspace A
  When I click workspace B in the sidebar
  Then the `vp_active_workspace` cookie is set to B
  And I land on `/rounds` for workspace B (not `/dashboard`).
- **AC-2 (race guard):**
  Given I double-click two different workspaces
  Then only one switch transition fires; the second click is ignored while `pending` is true.
- **AC-3 (cookie validation):**
  Given the cookie points to a workspace the user can't access
  Then `getActiveWorkspace()` falls back to the earliest owned/member workspace.
- **AC-4 (visual indicator):**
  Given the active workspace is W
  Then it renders with a primary dot and gradient mark in the sidebar.

### US-X03 — Sidebar expansion persistence

**As any** user
**I want to** have my sidebar group expansion state persist across navigations
**So that** I'm not re-expanding the Equity group on every page change
**Status:** Shipped v0.3.0.0 · **Priority:** P1
**File anchors:** `app/(app)/components/sidebar.tsx`

#### Acceptance Criteria

- **AC-1 (localStorage write):**
  Given I expand the Equity group
  Then `localStorage['venturepath-sidebar-expanded']` updates with the new state.
- **AC-2 (read on mount):**
  Given a stored state exists
  When the sidebar mounts on any route
  Then groups expand/collapse according to the stored state.
- **AC-3 (SSR safe):**
  Given SSR (no localStorage)
  Then initial render uses empty state (all collapsed)
  And hydration applies the localStorage state without a flash.

### US-X04 — Notification bell with badge (REQ-PLAT-01)

**As any** user
**I want to** see a notification bell badge when something I care about happens
**So that** I don't have to refresh listing pages or inbox routes
**Status:** Shipped v0.3.0.0 · **Priority:** P1
**File anchors:** `app/(app)/components/notifications-button.tsx`, `app/api/notifications/route.ts`, `supabase/migrations/20260518000000_account_notifications.sql`, `supabase/tests/account_notifications.sql`

#### Acceptance Criteria

- **AC-1 (poll on mount + every 60s):**
  Given the bell mounts
  Then it fetches `/api/notifications` immediately
  And re-fetches every 60 seconds.
- **AC-2 (badge shows unread count):**
  Given `unread_count > 0`
  Then a small gradient chip renders on the bell with the count (or "9+" if >9).
- **AC-3 (popover renders last 10):**
  Given the bell is clicked
  Then a popover renders up to 10 notifications, each with type icon, translated title, relative time.
- **AC-4 (link navigates):**
  Given a notification row is clicked
  Then it navigates to `notification.url` and closes the popover.
- **AC-5 (mark all as read):**
  Given the "Mark all as read" button is clicked
  Then `PATCH /api/notifications {action:'read_all'}` is called
  And every unread row for the user flips to `is_read=true`.
- **AC-6 (trigger: inquiry_received):**
  Given a `connection_inquiries` INSERT
  Then the listing owner gets a notification with `type='inquiry_received'`.
- **AC-7 (trigger: inquiry_accepted):**
  Given a `connection_inquiries` UPDATE from `sent` → `accepted`
  Then the inquirer gets a notification with `type='inquiry_accepted'`.
- **AC-8 (trigger: inquiry_declined):**
  Given the same transition to `declined`
  Then the inquirer gets a notification with `type='inquiry_declined'`.
- **AC-9 (trigger: rofr_notified):**
  Given a `rofr_notifications` INSERT where `notified_email` matches an `auth.users.email`
  Then that user gets a notification with `type='rofr_notified'`.
- **AC-10 (trigger: investor_update_opened):**
  Given an `investor_update_views` INSERT
  Then the round-owner gets a notification with `type='investor_update_opened'`.
- **AC-11 (RLS):**
  Given user A and B
  Then A's GET /api/notifications never returns B's rows.
- **AC-12 (i18n title override):**
  Given the user's language is Arabic
  Then the bell renders the Arabic version of the title from i18n, not the English DB-stored fallback.

### US-X05 — ⌘K full-text search (REQ-PLAT-02)

**As any** user
**I want to** hit ⌘K and search for a company / listing / round
**So that** power users get instant navigation
**Status:** Shipped v0.3.0.0 · **Priority:** P1
**File anchors:** `app/(app)/components/search-bar.tsx`, `app/api/search/route.ts`, `supabase/migrations/20260519000000_full_text_search.sql`

#### Acceptance Criteria

- **AC-1 (shortcut focus):**
  Given the user presses ⌘K (or Ctrl+K on non-Mac)
  Then the search input receives focus and the dropdown opens.
- **AC-2 (debounce 300ms):**
  Given the user types
  Then the API call fires 300ms after the last keystroke (not every key).
- **AC-3 (min query length):**
  Given the query is <2 chars
  Then the dropdown shows nothing (no API call); API returns 400 if called.
- **AC-4 (grouped results):**
  Given matching results across multiple entity types
  Then results render grouped as "Companies", "Listings", "Rounds", each with an SVG icon.
- **AC-5 (keyboard nav):**
  Given the dropdown is open with results
  Then ↓ / ↑ moves the active row, Enter navigates to its URL, Escape closes.
- **AC-6 (empty state):**
  Given the query returned 0 results
  Then the dropdown shows "No results for '{query}'".
- **AC-7 (index used):**
  Given the query reaches the RPC
  Then the GIN indexes back the `@@` tsquery match (EXPLAIN ANALYZE shows GIN scan on production-size data).
- **AC-8 (auth required):**
  Given an unauthenticated request to `/api/search`
  Then 401 is returned.
- **AC-9 (workspace gating):**
  Given workspaces filter
  Then only `public_profile_published=true` workspaces match.
  Given financing_rounds filter
  Then only `is_public=true AND status='open'` rounds match.
  Given connection_listings filter
  Then only `status='open' AND deleted_at IS NULL` rows match.

### US-X06 — Reply-capable thread view in /messages

**As any** user
**I want to** read inquiry threads and reply in-product instead of bouncing to email
**So that** conversations stay in context
**Status:** Shipped v0.3.0.0 · **Priority:** P1
**File anchors:** `app/(app)/messages/[inquiryId]/`, `supabase/migrations/20260520300000_inquiry_messages.sql`

#### Acceptance Criteria

- **AC-1 (route exists):**
  Given a valid inquiry id the user is a party to
  Then `/messages/[inquiryId]` renders the thread view.
- **AC-2 (RLS — non-party blocked):**
  Given a user is neither inquirer nor listing owner
  Then `/messages/[inquiryId]` returns 404 (RLS hides the row).
- **AC-3 (send reply):**
  Given the inquiry status is `sent` or `accepted`
  When the user submits a reply (1-2000 chars)
  Then a `connection_inquiry_messages` row is inserted with `sender_user_id = auth.uid()`
  And the thread updates.
- **AC-4 (closed inquiry blocks send):**
  Given the inquiry status is `closed` or `declined`
  Then the reply textarea is disabled with a hint
  And the server action rejects (RLS blocks).
- **AC-5 (over 2000 chars rejected):**
  Given the body > 2000 characters
  Then the server action rejects
  And the form shows a counter.
- **AC-6 (inbox routing):**
  Given a row in the `/messages` inbox is clicked
  Then it navigates to `/messages/[inquiryId]` (the thread)
  And a secondary "View listing →" link inside the row goes to `/connections/[listingId]` (the action surface).

### US-X07 — Change password + email from settings

**As any** user
**I want to** change my password and email from settings
**So that** security hygiene without an admin ticket
**Status:** Shipped v0.3.0.0 · **Priority:** P1
**File anchors:** `app/(app)/settings/settings-view.tsx`, `app/(app)/settings/settings-actions.ts`

#### Acceptance Criteria

- **AC-1 (password update):**
  Given the user enters current + new password
  When they submit
  Then `supabase.auth.updateUser({password})` is called
  And the form shows "Password updated" on success.
- **AC-2 (email update sends verification):**
  Given the user enters a new email
  Then `supabase.auth.updateUser({email})` is called
  And a verification email is sent
  And the form shows "Verification email sent — check your inbox".
- **AC-3 (form error visible):**
  Given any update fails
  Then the form shows the error message inline.

### US-X08 — KSA PDPL data export

**As any** user (KSA PDPL right to access)
**I want to** download all my data as JSON on demand
**So that** I exercise my right to access
**Status:** Shipped v0.3.0.0 · **Priority:** P1
**File anchors:** `app/(app)/settings/settings-actions.ts` (`requestDataExport`)

#### Acceptance Criteria

- **AC-1 (download):**
  Given the user clicks "Download my data"
  Then a JSON blob is generated containing data from 10 sources (workspaces owned, members, shareholders, listings, inquiries, audit events, traction, etc.)
  And the browser downloads the file.
- **AC-2 (own data only):**
  Given the JSON dump
  Then it contains ONLY data scoped to the user (own workspaces + own inquiries + own user_profile).

### US-X09 — KSA PDPL deletion request

**As any** user (KSA PDPL right to erasure)
**I want to** request account deletion (30-day window)
**So that** I exercise my right to erasure
**Status:** Shipped v0.3.0.0 (request); v1.3 P0 (fulfilment) · **Priority:** P1
**File anchors:** `app/(app)/settings/settings-actions.ts` (`requestAccountDeletion`), `supabase/migrations/20260520100000_settings_infra.sql`

#### Acceptance Criteria

- **AC-1 (confirmation dialog):**
  Given the user clicks "Delete my account"
  Then a confirmation dialog renders with "This will permanently delete your account, all workspaces you own, and all associated data. Your account will be deleted within 30 days of this request. This action cannot be undone."
- **AC-2 (request insert):**
  Given the user confirms with optional reason
  Then an `account_deletion_requests` row is inserted (INSERT-only RLS).
- **AC-3 (UI state after request):**
  Then the privacy section renders "Deletion requested — your account will be permanently deleted within 30 days."
- **AC-4 (v1.3 P0 known gap):**
  The scheduled job that ACTUALLY deletes after 30 days is not wired in v0.3.0.0 (documented in TODOS.md).

### US-X10 — Date format preference

**As any** user in KSA
**I want to** have my dates render as DD/MM/YYYY by default
**So that** the product respects my locale
**Status:** Shipped v0.3.0.0 · **Priority:** P1
**File anchors:** `lib/date/format.ts`, `lib/date/format.test.ts`, `app/(app)/settings/settings-view.tsx`

#### Acceptance Criteria

- **AC-1 (3 formats supported):**
  Given the user picks ISO / US / EU
  Then `user_profiles.date_format` is updated
  And the helper renders accordingly: ISO `2026-05-17`, US `5/17/2026`, EU `17/05/2026`.
- **AC-2 (default for KSA users):**
  Given a new user
  Then the default is "EU" (DD/MM/YYYY) since that's KSA convention.

### US-X11 — Notification preferences per type + channel

**As any** user
**I want to** mute specific notification categories per channel (email / in-app)
**So that** I'm not nagged on categories I don't care about
**Status:** Shipped v0.3.0.0 (preferences); v1.3 P0 (enforcement) · **Priority:** P1
**File anchors:** `app/(app)/settings/settings-view.tsx`, `supabase/migrations/20260520100000_settings_infra.sql`

#### Acceptance Criteria

- **AC-1 (toggle persistence):**
  Given the user toggles email or in-app off for a notification type
  Then a `user_notification_preferences` row is upserted with `(user_id, notification_type)` composite key.
- **AC-2 (UI reflects state):**
  Given a preference exists with `email_enabled=false`
  Then the email column shows the toggle in the off state.
- **AC-3 (v1.3 P0 known gap):**
  The email send path in `lib/email/*` does NOT yet read the preferences; enforcement is deferred (documented in TODOS.md).

### US-X12 — 2FA + active sessions (v1.3 P0)

**As any** user
**I want to** enroll 2FA and view active sessions across devices
**So that** my account is hardened
**Status:** Scaffolded v0.3.0.0; **v1.3 P0** · **Priority:** P2

#### Acceptance Criteria (v1.3 target)

- **AC-1 (TOTP enrollment):** UI shows QR code; verification step accepts 6-digit code; user can require 2FA on next login.
- **AC-2 (active sessions list):** Settings shows a table of active sessions with device + IP + last-seen; user can revoke any.
- **AC-3 (login history):** Read-only audit list of recent sign-ins.

(Currently shipped as "Coming soon" scaffold cards.)

### US-X13 — OAuth providers (v1.3 P2)

**As any** user
**I want to** sign in with Google / LinkedIn / Apple OAuth
**So that** lower friction on signup
**Status:** UI buttons present since v1.1; **v1.3 P2** · **Priority:** P2

#### Acceptance Criteria (v1.3 target)

- **AC-1 (Google OAuth):** Clicking the Google button initiates Supabase `signInWithOAuth({provider:'google'})` flow.
- **AC-2 (LinkedIn + Apple):** Same for LinkedIn and Apple.
- **AC-3 (post-OAuth user_profiles populate):** Display name + avatar pre-fill from the OAuth profile when possible.

(Currently the buttons render and click-handler is wired to a placeholder.)

### US-X14 — Paid plan + billing rail (v1.3 P1)

**As a** Founder (P1)
**I want to** upgrade to a paid plan and pay via Stripe / HyperPay / invoice
**So that** I can use advanced analytics + priority support
**Status:** Marketing card present in v0.3.0.0; **v1.3 P1** · **Priority:** P2

#### Acceptance Criteria (v1.3 target)

- **AC-1 (billing rail integrated):** Stripe (or HyperPay for KSA-native) checkout session creation.
- **AC-2 (subscription state):** `user_profiles.plan_tier` or a `subscriptions` table tracks tier.
- **AC-3 (feature gate):** Advanced analytics / white-label reports gated by `plan_tier`.

(Currently the upgrade CTA is a mailto link.)

---

## 7. Cross-cutting acceptance criteria

The following ACs apply to **every** story, not just one:

- **AC-CC-1 (i18n parity):** Every new user-facing string lands with both EN and AR translations in `lib/i18n/locales/{en,ar}/*.json`. No `key.literal.fallback` text in production.
- **AC-CC-2 (RTL safe):** Every new UI surface renders correctly in `dir="rtl"` — no `left`/`right` physical properties; uses `ps-`/`pe-`/`start`/`end` logical properties.
- **AC-CC-3 (audit logged):** Every regulated mutation (cap-table change, listing accept/withdraw/sold, round close, member add/remove, public-profile publish) writes an `audit_events` row.
- **AC-CC-4 (RLS):** Every new table that holds user data has RLS enabled with at least a `SELECT WHERE workspace member` policy. Write policies are owner-only unless explicitly documented otherwise.
- **AC-CC-5 (SECURITY DEFINER explicit check):** Every `SECURITY DEFINER` RPC checks `auth.uid()` is non-null AND that the caller has the required relationship (owner / inquirer / member) to the target row.
- **AC-CC-6 (type-check + lint + build):** `npx tsc --noEmit`, `npx eslint app lib supabase`, `npx next build` must all pass cleanly before merge.
- **AC-CC-7 (vitest):** No regression in the baseline test count (157 as of v0.3.0.0).
- **AC-CC-8 (DESIGN.md compliance):** New visual surfaces follow Kinetic Sovereign: papyrus base, teal gradient CTAs, ghost-border cards, tabular-nums on numbers, Cairo+Inter typography.
- **AC-CC-9 (mobile / responsive):** New routes render correctly down to 360px viewport width. Sidebar collapses to mobile drawer below `md:` breakpoint.
- **AC-CC-10 (accessibility):** Interactive elements have `aria-label` or visible text; focus states visible; keyboard nav reaches every actionable element. Target WCAG 2.1 AA.

---

## 8. Story status legend

- **Shipped vX.Y.Z** — feature is live on production; AC verified against the deployed surface
- **Scaffolded vX.Y.Z** — UI placeholder visible; full wiring pending (e.g. 2FA "Coming soon" cards)
- **vX.Y P0/P1/P2** — backlog item, not shipped; AC is target-state
- **Priority** — P1 = MVP for current cycle (all v0.3.0.0 shipped), P2 = high-value next cycle (v1.3 candidates), P3 = v2 only

---

## 9. Story coverage matrix

| Hub | Stories | Shipped | Scaffolded | Planned (v1.3) |
| :--- | :--- | :--- | :--- | :--- |
| Startup | US-S01 – US-S09 | 9 | 0 | 0 |
| Investment | US-I01 – US-I13 | 13 | 0 | 0 |
| Trading | US-T01 – US-T07 | 7 | 0 | 0 |
| Exit | US-E01 – US-E07 | 7 | 0 | 0 |
| Partnership | US-P01 – US-P08 | 8 | 0 | 0 |
| Platform | US-X01 – US-X14 | 11 | 1 (US-X12) | 2 (US-X13, US-X14) |
| **Total** | **48** | **55** *(some span multiple ACs)* | **1** | **2** |

Every story above traces back to one of:
- `docs/prd-venturepath.md` §4.2 (registry)
- `docs/prd-venturepath-deep-dive.md` §13 (v1.2 delta with features / requirements / user stories)
- `docs/prd-connections-hub.md` §6, §18, §19 (Connections Hub specifics)
- `CHANGELOG.md` [0.3.0.0] entry

For acceptance-criteria-driven QA, use this file as the canonical checklist.
For architecture context behind each story, follow the file anchors.
For deferred work (v1.3 backlog), see `TODOS.md`.
