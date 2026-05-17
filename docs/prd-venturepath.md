# VenturePath — Product Requirement Document (PRD)

## 1. Document Control

| Field | Details |
| :--- | :--- |
| **Product Name** | VenturePath — Sharia-compliant operating system for KSA founders |
| **Product Manager (PM)** | Waleed Alsanosi |
| **Lead Designer (UX/UI)** | Waleed Alsanosi (Kinetic Sovereign design system — see `DESIGN.md`) |
| **Tech Lead / Architect** | Waleed Alsanosi |
| **Status** | Approved — v0.3.0.0 shipped 2026-05-17; v1.3 backlog open |
| **Target Release Date** | Live in production at https://venture-path.vercel.app/ . v1.3 target: 2026-Q3 |
| **Repo / Branch** | `waleedahmedalsanosi/VenturePath` · production branch `claude/activate-bypass-permissions-0sjk1` |
| **Companion docs** | `docs/prd-venturepath-deep-dive.md` (architecture + hub-level deep dive) · `docs/prd-connections-hub.md` (Exit + Partnership Hubs schema + RLS) · `DESIGN.md` · `CHANGELOG.md` · `TODOS.md` |

---

## 2. Product Vision & Objective

### 2.1 Background & Summary

VenturePath is the **Sharia-compliant operating system for KSA founders**, covering the full lifecycle: cap table, fundraising, secondary equity trading, whole-company exits, and founder partnerships (co-founders, advisors, senior hires, business partners) — in one bilingual (EN/AR + RTL) platform.

The product is organised into **five hubs** + a **platform layer**. Each hub is independently usable and shippable. No fund movement on platform; every transaction closes off-platform under existing KSA legal frameworks (Sharia + CMA aligned).

**Core problems solved:**
1. **Cap-table chaos** — founders manage equity in Excel. No Sharia-compliant tooling exists; US tools like Carta don't model iSAFE.
2. **Fundraising fragmentation** — round-running spread across Excel / email / Drive / WhatsApp. No structured pipeline, no auto-conversion of iSAFE/SAFE/CN on close.
3. **Trapped equity** — existing shareholders wanting to sell part of their stake have no bulletin board with built-in ROFR.
4. **Broken founder marketplaces** — exit-seekers and partnership-seekers currently live in LinkedIn DMs, Telegram groups, or paid brokers.

**Why VenturePath wins:**
- **iSAFE wedge** — Sharia-compliant convertible instrument built for KSA market reality. Permanent green identity in the design system.
- **KSA-first** — SAR-native, ZATCA-aware, Hijri-friendly, Cairo + Inter typography, full RTL.
- **Verified-data moat** — every cross-workspace listing is anchored to a real cap table on platform. AngelList has anonymous profiles; we have cap-table receipts.
- **Off-platform closing** — no fund custody, no settlement risk; aligned with CMA broker-dealer reality and Sharia jurisprudence.

### 2.2 Business Goals

1. **G1 — Seller-side activation in KSA founder market.** Validate that two named founders (Samir for exits, Saif for partnerships) close real transactions on VenturePath within 90 days of v0.3.0.0 ship. *(Premise 1 from the founder's office-hours doc.)*
2. **G2 — Cross-workspace flywheel.** Get to 5+ public secondary listings and 5+ public open rounds within 30 days of v0.3.0.0 — the threshold where Browse tabs become useful rather than empty.
3. **G3 — Sharia and CMA clearance.** Close out the Turky (Sharia advisor) consult extension and the Mahmoud (CMA contact) go/no-go for whole-company exit listings before the public Exit Hub launch.
4. **G4 — Bilingual parity.** No English-only surface ships to production. Every new feature lands with both EN and AR i18n.
5. **G5 — Zero-fund-movement compliance posture.** Maintain the bulletin-board model. Reject any feature proposal that puts the platform in custody / settlement / payments scope.

### 2.3 Success Metrics (KPIs)

| KPI | Target | Measurement |
| :--- | :--- | :--- |
| **K1 — Workspaces with at least 1 published listing/round** | 5+ within 30 days of v0.3.0.0 | `share_listings.is_public=true` ∪ `financing_rounds.is_public=true` ∪ `connection_listings.status='open'` |
| **K2 — Connection-inquiry handshakes (sent → accepted)** | First handshake within 7 days; 5+ within 30 days | `connection_inquiries.status='accepted'` count |
| **K3 — Real off-platform close** | First closed deal (exit OR partnership OR secondary) attested by founder by day 90 | Manual attestation + `mark_share_listing_sold_off_platform` cap-table sync |
| **K4 — Daily active workspaces** | Establish baseline; target 30%+ DAU growth MoM over Q3 | Distinct workspace IDs with at least one server action / page view per day |
| **K5 — Investor-update open rate** | ≥40% per send by v1.3 | `investor_update_recipients.opened_at IS NOT NULL` / total recipients |
| **K6 — Notification feed unread→read latency** | Median <12h once a user signs in | `account_notifications.is_read` flip timestamp |
| **K7 — Bilingual usage** | ≥20% of sessions in Arabic by v1.3 | `<html lang="ar">` sessions / total |

**Kill criteria** (per hub) — if true at day 30 post-launch, deprecate the hub or the surface:

| Hub | If by Day 30… | Then |
| :--- | :--- | :--- |
| Exit | No exit listings beyond Samir despite direct outreach | Premise 1 wrong — pause exit listing type |
| Partnership | No partnership listings beyond Saif despite direct outreach | Premise 1 wrong — pause partnership listing type |
| Trading | <5 public secondary listings | Re-evaluate publish-flow UX |
| Investment cross-workspace | <5 public open rounds | Founders don't want public rounds — keep workspace-internal only |

The Startup Hub has no kill criteria — it is the substrate the other hubs depend on.

---

## 3. User Personas & Target Audience

| Persona | Description | Primary hub(s) | Wedge action |
| :--- | :--- | :--- | :--- |
| **P1 — Founder, pre-seed/seed** | KSA founder running their first proper raise. | Startup, Investment | Set up cap table, run an iSAFE round, send investor updates. |
| **P2 — Founder, late-stage** | Has investors, runway concerns, or exit interest. | Investment, Exit, Trading | Model dilution / waterfall; list for exit; let early shareholders post secondary asks. |
| **P3 — Founder, partnership-seeking** *(Saif)* | Actively looking for co-founder / advisor / senior hire / business partner. | Partnership | List partnership opportunity; respond to inquiries. |
| **P4 — Founder, exit-seeking** *(Samir / Probuy)* | Wants to sell the company. | Exit | List for exit; grant data-room access on inquiry accept. |
| **P5 — Operator** (senior hire, advisor candidate) | Senior individual contributor or advisor open to joining a KSA startup. | Partnership | Browse partnership listings; send inquiry; accept equity grant. |
| **P6 — Existing shareholder** (employee, angel) | Owns equity, wants partial liquidity. | Trading | Post secondary ask; respond to ROFR notifications. |
| **P7 — Acquirer / strategic** | Wants to buy a KSA company or do an acqui-hire. | Exit | Browse exit listings; send inquiry; access scoped data room. |
| **P8 — Investor** (VC, angel, family office) | Browses for opportunities + tracks portfolio. | Investment, Trading, Exit | Browse open rounds, secondary listings, exit listings; assess via verified data. |
| **P9 — System Administrator** | Internal ops (founder + future support hires). | Platform | Manage workspace integrity; respond to compliance flags. |

**Validation status:** P3 (Saif) and P4 (Samir) are validated by direct unprompted follow-up. P5, P7, P8 are inferred from market structure and not pre-validated with named individuals — relying on seller-side personas (P3, P4) being correct first.

---

## 4. Feature Scope & Requirements

### 4.1 Scope Classification

#### In-Scope (Shipped — v0.3.0.0)

**Startup Hub** — workspace identity + governance + compliance + ops:
- Dashboard (`/dashboard`) with KPI tiles and Connections pulse.
- Company info + public profile (`/company`) with toggle to publish.
- Workspace members + roles (`/members`, owner / admin / viewer enum).
- Governance (`/governance`) — board meetings + resolutions.
- KSA compliance timeline (`/compliance`) — ZATCA, GAZT, MOC obligations.
- Document Vault (`/vault`) — tiered access (intro / standard / diligence) via signed tokens.
- Traction (`/traction`) — MRR, customers, runway with publish toggles per metric.
- Audit trail (`/audit`) — tamper-proof append-only event log.
- User profile (`/profile`, `/profile/edit`) — display name, bio, avatar, LinkedIn, location.

**Investment Hub** — fundraising end-to-end:
- Cap table (`/cap-table`) — iSAFE, SAFE, Convertible Note, Ordinary instruments.
- ESOP (`/esop`) — pool size, grants, vesting schedules.
- Financing rounds (`/rounds`) with Open (cross-workspace) and Mine tabs.
- `is_public` toggle (REQ-INV-02) — round-creation wizard + management view.
- Atomic `close_financing_round` RPC (REQ-INV-01) — auto-converts iSAFE/SAFE/CN to ordinary in one transaction.
- Term sheets (`/term-sheets`) — templates per instrument.
- Investor updates (`/investor-updates`) with per-recipient open tracking (REQ-INV-03) + re-send to unopened.
- Valuation (`/valuation`), Dilution modeller (`/dilution`) with ≥30% warn + >50% block, Waterfall (`/waterfall`), M&A modeller (`/acquisition` — REQ-EXIT-01).

**Trading Hub** — secondary equity:
- Browse (cross-workspace public listings + exit listings co-located) and Mine tabs at `/marketplace`.
- `is_public` toggle (REQ-TRADE-01) with ROFR-window gate.
- Transfer-agent cap-table sync (REQ-TRADE-02) — buyer details on mark-sold auto-update cap table.
- ROFR notifications (`rofr_notifications` table) — existing shareholders notified per listing.

**Exit Hub** — whole-company exits:
- Exit listing creation (`/connections/new?type=exit`) + management.
- Cross-workspace browse co-located on `/marketplace` Browse + `/connections?filter=exit`.
- M&A modelling (`compute_acquisition_model` RPC) with 5-scenario cap per workspace.
- Inquiry handshake (one-step accept → contact reveal + signed data-room token).

**Partnership Hub** — human-capital matchmaking:
- Partnership listing creation + management with structured fields (seeking_type, skills, equity_expectations, commitment_type).
- Talents (`/connections?seeking=senior_hire`) and Advisors (`/connections?seeking=advisor`) deep-link filters.
- `seeking_type` first-class indexed column (REQ-PART-01).
- Context-aware eyebrow + subtitle per seeking variant (audit item #12).
- Equity-terms gating (audit item #10) — request-to-view flow on partnership listings.
- Co-founder and business-partner variants via the same `seeking_type` column.

**Platform Layer**:
- Bilingual EN/AR + full RTL (28 i18n namespaces, react-i18next).
- Multi-workspace switching with localStorage-persisted sidebar state.
- `/messages` inquiry inbox + `/messages/[inquiryId]` reply-capable thread view.
- `/explore` cross-workspace discovery (companies + exits + partnerships + secondaries).
- Data room signed-token mechanism (TTL default 14d, max 90d).
- `account_notifications` aggregation + bell wiring (REQ-PLAT-01) — 4 triggers across inquiry / ROFR / update view.
- Full-text search (REQ-PLAT-02) — tsvector + GIN + ⌘K dropdown.
- `/settings` — real password + email change; date format + timezone; per-type notification preferences; KSA PDPL data export; account-deletion request (30-day pattern); plan/billing surface; "Coming soon" scaffolds for 2FA + active sessions.
- Tamper-proof audit trail (`audit_events`) — immutability trigger over 9 entity types.
- Split-layout auth pages (`/sign-in`, `/sign-up`).

#### Out-of-Scope (v1.3 candidates — deliberately deferred)

- **Real 2FA enrollment + active session management.** v0.3.0.0 ships UI scaffolds; Supabase MFA wiring deferred.
- **Plan & billing — paid tier.** v0.3.0.0 ships a marketing card; no Stripe / HyperPay / invoicing rail.
- **Notification-preference enforcement in email delivery.** Preferences persist; email sender doesn't read them yet.
- **DB-level equity-terms split.** UI gates `equity_expectations`; JSONB column is still cross-workspace-readable. Splitting into `type_data_public` / `type_data_private` closes the loophole.
- **Account-deletion fulfilment cron.** Request-only pattern shipped; no scheduled job deletes data after 30 days.
- **OAuth providers** (Google / LinkedIn / Apple) — buttons visible since v1.1, none wired.
- **Search across investor_updates / term_sheets / audit_events.** v0.3.0.0 covers workspaces + connection_listings + financing_rounds.
- **Notification trigger on inquiry-message reply.** Thread view ships without a notification when a reply lands.

#### Out-of-Scope (v2 — explicit non-goals)

- **On-platform fund movement.** No custody / settlement / payments. *Sharia + CMA choice, not a feature gap.*
- **Anonymous listings (Exit or Partnership).** v1 named-only.
- **DocuSign-style real NDA gate** at data-room access.
- **Algorithmic matching** for Partnership Hub (browse + filter is the wedge).
- **Co-founder sub-marketplace** separate from Partnership Hub.
- **Advisory marketplace pricing model.**
- **Readiness assessment scoring** for exit listings.
- **Events / demo days.**
- **Sector / proximity filters on browse.** Requires `workspace.sector` model expansion.
- **Multi-shareholder bundle listings** in Trading Hub.
- **Listing-fee monetisation** ("see who viewed your listing", paywalls). Pre-revenue by design.

### 4.2 Functional Requirements & User Stories

User stories ordered by hub, then by priority. Priorities: **P1** = MVP for v0.3.0.0 (all shipped); **P2** = high-value v1.3; **P3** = v2 candidates.

#### Startup Hub

| ID | As a... | I want to... | So that... | Status | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **US-S01** | Founder (P1) | Create a workspace with company info, sector, founding year, one-liner | I can have a single source of truth for my startup's identity | Shipped v0.1.0 | P1 |
| **US-S02** | Founder (P1) | Invite team members and assign owner / admin / viewer roles | I can give my CFO access to cap table without giving them workspace deletion power | Shipped v0.1.0 | P1 |
| **US-S03** | Founder (P1) | Track ZATCA / GAZT / MOC compliance obligations with due dates | I never miss a filing | Shipped v0.1.0 | P1 |
| **US-S04** | Founder (P1) | Schedule board meetings and store resolution templates | I have a paper trail aligned with KSA company law | Shipped v0.1.0 | P1 |
| **US-S05** | Founder (P1) | Upload documents to a vault with intro / standard / diligence access tiers | I can share documents externally without granting workspace membership | Shipped v0.1.0 | P1 |
| **US-S06** | Founder (P1) | Record monthly traction metrics (MRR, customers, runway) | I have a structured history for investor updates | Shipped v0.1.0 | P1 |
| **US-S07** | Founder (P1) | See an immutable audit trail of every regulated state change | I can defend a regulator inquiry without scrambling | Shipped v0.1.0 | P1 |
| **US-S08** | User (any persona) | Have a real profile with display name, bio, avatar, LinkedIn, location | Other VenturePath users see me as a person, not an email | Shipped v0.3.0.0 | P1 |
| **US-S09** | Founder (P1) | Publish or unpublish my company profile from `/explore` | I control my market visibility | Shipped v0.1.0 | P1 |

#### Investment Hub

| ID | As a... | I want to... | So that... | Status | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **US-I01** | Founder (P1) | Add shareholders with iSAFE / SAFE / Convertible Note / Ordinary instruments | My cap table reflects every commitment | Shipped v0.1.0 | P1 |
| **US-I02** | Founder (P1) | Issue ESOP grants with vesting schedules | I can compensate employees with equity Sharia-compliantly | Shipped v0.1.0 | P1 |
| **US-I03** | Founder (P1) | Open a financing round with target raise + pre-money | Investors have a structured pipeline to land in | Shipped v0.1.0 | P1 |
| **US-I04** | Founder (P1) | Track investor pipeline per round (prospect / contacted / in_discussion / term_sheet / passed / invested) | I can manage 30 investors without losing context | Shipped v0.1.0 | P1 |
| **US-I05** | Founder (P1) | Generate term sheets per investor + track sent / signed / declined status | Round close auto-promotes signed term sheets | Shipped v0.1.0 | P1 |
| **US-I06** | Founder (P1) | Close a round and have iSAFE / SAFE / CN holders auto-convert to ordinary in one atomic transaction | Mid-flight failure cannot leave my cap table half-converted | Shipped v0.3.0.0 (REQ-INV-01) | P1 |
| **US-I07** | Founder (P1) | Make my round discoverable to other VenturePath investors with a one-click toggle | Cross-workspace investors can find me without me having to email them | Shipped v0.3.0.0 (REQ-INV-02) | P1 |
| **US-I08** | Founder (P1) | Be warned (≥30%) or blocked (>50%) when implied single-round dilution looks like a typo | I don't publicly broadcast 60% dilution because I forgot a zero on pre-money | Shipped v0.3.0.0 | P1 |
| **US-I09** | Investor (P8) | Browse open rounds across every VenturePath workspace that opted in | I find KSA deals I'd never see otherwise | Shipped v1.1 / v0.3.0.0 (exclude-own) | P1 |
| **US-I10** | Founder (P1) | Send an investor update via Resend with per-recipient open tracking | I know who's reading and can re-send only to the unopened | Shipped v0.3.0.0 (REQ-INV-03) | P1 |
| **US-I11** | Founder (P1) | Model dilution scenarios before publishing a round | I don't get surprised by the post-money cap table | Shipped v0.1.0 | P1 |
| **US-I12** | Founder (P2) | Model liquidation waterfalls per instrument class | I know what each investor actually gets at exit | Shipped v0.1.0 | P1 |
| **US-I13** | Founder (P2) | Save and compare M&A scenarios with per-shareholder payouts | I can negotiate from a position of knowing the math | Shipped v0.3.0.0 (REQ-EXIT-01) | P1 |

#### Trading Hub

| ID | As a... | I want to... | So that... | Status | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **US-T01** | Existing shareholder (P6) | Post a secondary ask with shares + ask price + optional notes | I have a posted-ask bulletin board instead of WhatsApp negotiation | Shipped v0.1.0 | P1 |
| **US-T02** | Existing shareholder (P6) | Trigger ROFR notifications to other shareholders automatically | I don't bypass their right of first refusal | Shipped v0.1.0 | P1 |
| **US-T03** | Existing shareholder (P6) | Make my listing visible to all VenturePath members with one click | Buyers across workspaces can find me | Shipped v0.3.0.0 (REQ-TRADE-01) | P1 |
| **US-T04** | Existing shareholder (P6) | Be prevented from making a listing public while an ROFR window is still open | The ROFR mechanism stays meaningful | Shipped v0.3.0.0 | P1 |
| **US-T05** | Founder (P1) | Mark a listing sold off-platform with optional buyer details | My cap table updates automatically — buyer appears, seller's count drops | Shipped v0.3.0.0 (REQ-TRADE-02) | P1 |
| **US-T06** | Buyer (P8) | Browse public secondary listings + exit listings co-located | I have one place to find KSA equity opportunities | Shipped v1.1 / v0.3.0.0 (exclude-own) | P1 |
| **US-T07** | Existing shareholder (P6) | Withdraw a listing if the deal falls through | The browse view stays accurate | Shipped v0.1.0 | P1 |

#### Exit Hub

| ID | As a... | I want to... | So that... | Status | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **US-E01** | Founder, exit-seeking (P4) | List my company for exit with structured ask details (sale / open-to-offers / acqui-hire / merger) | Acquirers find me without me hiring a broker | Shipped v0.2.0.0 | P1 |
| **US-E02** | Founder, exit-seeking (P4) | Have inquirers see my listing across every VenturePath workspace | Maximum buyer pool | Shipped v0.2.0.0 / v1.1 | P1 |
| **US-E03** | Acquirer (P7) | Send a structured inquiry on an exit listing | The seller can accept/decline without bouncing to email | Shipped v0.2.0.0 | P1 |
| **US-E04** | Acquirer (P7) | Receive a signed data-room token on inquiry accept | I can do scoped due diligence without joining the seller's workspace | Shipped v0.2.0.0 | P1 |
| **US-E05** | Founder, exit-seeking (P4) | Be blocked from having both an exit listing and open secondary listings simultaneously | The market gets one clear signal about my workspace's intent | Shipped v0.2.0.0 | P1 |
| **US-E06** | Founder, exit-seeking (P4) | Save M&A modelled scenarios and optionally attach one to my exit listing | Inquirers see my modelled outcome at the asking price | Shipped v0.3.0.0 (REQ-EXIT-01) | P1 |
| **US-E07** | Founder (P1, P4) | Withdraw an exit listing without consequence | I can reverse course if my situation changes | Shipped v0.2.0.0 | P1 |

#### Partnership Hub

| ID | As a... | I want to... | So that... | Status | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **US-P01** | Founder, partnership-seeking (P3) | List a partnership opportunity with structured fields (seeking_type, skills, equity_expectations, commitment_type) | Candidates self-filter by fit | Shipped v0.2.0.0 | P1 |
| **US-P02** | Founder, partnership-seeking (P3) | Have my listing discoverable cross-workspace | Talent / advisors find me without me cold-DMing on LinkedIn | Shipped v0.2.0.0 | P1 |
| **US-P03** | Founder, partnership-seeking (P3) | Be blocked from having a partnership listing AND an exit listing simultaneously | Market doesn't get confused about my intent | Shipped v0.2.0.0 | P1 |
| **US-P04** | Operator (P5) | Browse partnership listings filtered by senior_hire / advisor / co_founder / business_partner | I see only listings that match my role | Shipped v1.1 (filter) / v0.3.0.0 (indexed column) | P1 |
| **US-P05** | Founder, partnership-seeking (P3) | Have my equity_expectations field gated behind "request to view" | My negotiating terms aren't broadcast to every signed-in user | Shipped v0.3.0.0 (UI gate; v1.3 DB split) | P1 |
| **US-P06** | Operator (P5) | Click "Request equity terms" and have it fire the standard inquiry flow | I don't have to learn a new mechanism per field | Shipped v0.3.0.0 | P1 |
| **US-P07** | Operator (P5) | See a partnership listing page with eyebrow / subtitle specific to my role (Talents / Advisors / Co-founders / Business partners) | The product talks to my use case | Shipped v0.3.0.0 | P1 |
| **US-P08** | Operator (P5) | Send an inquiry on a partnership listing | The founder can accept and start a conversation | Shipped v0.2.0.0 | P1 |

#### Platform Layer

| ID | As a... | I want to... | So that... | Status | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **US-X01** | Any user | Use the product in either English or Arabic with full RTL | KSA-first means Arabic-first, not Arabic-bolt-on | Shipped v0.2.0.0 / hardened v1.1 | P1 |
| **US-X02** | Any user | Own multiple workspaces and switch between them in the sidebar | Founders running two startups don't manage two accounts | Shipped v1.1 / hardened v0.3.0.0 | P1 |
| **US-X03** | Any user | Have my sidebar group expansion state persist across navigations | I'm not re-expanding the Equity group on every page change | Shipped v0.3.0.0 | P1 |
| **US-X04** | Any user | See a notification bell badge when something I care about happens | I don't have to refresh listing pages or inbox routes | Shipped v0.3.0.0 (REQ-PLAT-01) | P1 |
| **US-X05** | Any user | Hit ⌘K and search for a company / listing / round | Power users get instant navigation | Shipped v0.3.0.0 (REQ-PLAT-02) | P1 |
| **US-X06** | Any user | Read inquiry threads and reply in-product instead of bouncing to email | Conversations stay in context | Shipped v0.3.0.0 | P1 |
| **US-X07** | Any user | Change my password and email from settings | Security hygiene without an admin ticket | Shipped v0.3.0.0 | P1 |
| **US-X08** | Any user (KSA PDPL) | Download all my data as JSON on demand | I exercise my right to access | Shipped v0.3.0.0 | P1 |
| **US-X09** | Any user (KSA PDPL) | Request account deletion (30-day window) | I exercise my right to erasure | Shipped v0.3.0.0 (request); fulfilment v1.3 | P1 |
| **US-X10** | Any user in KSA | Have my dates render as DD/MM/YYYY by default | The product respects my locale | Shipped v0.3.0.0 | P1 |
| **US-X11** | Any user | Mute specific notification categories per channel (email / in-app) | I'm not nagged on categories I don't care about | Shipped v0.3.0.0 (preferences); enforcement v1.3 | P1 |
| **US-X12** | Any user | Enroll 2FA and view active sessions across devices | My account is hardened | Scaffolded v0.3.0.0; **v1.3 P0** | P2 |
| **US-X13** | Any user | Sign in with Google / LinkedIn / Apple OAuth | Lower friction on signup | UI present v1.1; **v1.3 P2** | P2 |
| **US-X14** | Founder (P1) | Upgrade to a paid plan and pay via Stripe / HyperPay / invoice | I can use advanced analytics + priority support | Surface present v0.3.0.0; **v1.3 P1** | P2 |

---

## 5. User Experience & Design

- **Design system:** Kinetic Sovereign (papyrus + teal gradient + glass refraction). Full spec in `DESIGN.md`. iSAFE green identity is permanent; magenta exits + lavender partnerships in `§3.6`.
- **Typography:** Inter (Latin) + Cairo (Arabic).
- **RTL:** Logical properties throughout (`start` / `end`, `ps-*` / `pe-*`). No `left` / `right` physical properties in new code.
- **Theme:** `data-theme="light|dark"` on `<html>`. Pre-paint bootstrap script avoids flash. Auth marketing pane is locked to dark independent of theme.
- **Shell:** Sticky translucent header (hamburger + workspace switcher · centered ⌘K search · language + theme + notifications + avatar). Narrow icon-rail sidebar with `My Startup` expandable into per-workspace nav. User pill at sidebar bottom with FREE tier badge.
- **Card feeds:** Gradient `WorkspaceMark` per card on rounds / marketplace / connections / messages. Word-safe truncation via `lib/text/truncate.ts`.
- **Mockups:** No standalone Figma file — design lives in code per `DESIGN.md` (component spec as source of truth).
- **Flow diagrams:** State-machine diagrams for the inquiry handshake and round-close flow in `docs/prd-connections-hub.md` §7 and `docs/prd-venturepath-deep-dive.md` §13.1 respectively.

---

## 6. Non-Functional Requirements

### 6.1 Performance & Scalability

- **Page load:** Server-rendered routes target <2.0s on KSA 4G. Next.js dynamic routes with selective `force-dynamic` for cross-workspace queries; partial indexes on the hot paths (`share_listings_public_open_idx`, `financing_rounds`/`is_public`, `connection_listings_seeking_type_idx`, `connection_listings_browse_idx`).
- **Search latency:** ⌘K dropdown targets <300ms p95 from keystroke to render (debounce 300ms; tsvector + GIN indexes; LIMIT 20).
- **Cap-table mutation atomicity:** Round close runs as a single Postgres transaction via the `close_financing_round` RPC. No partial state.
- **Concurrency:** All write-path RPCs use `FOR UPDATE` row locks to prevent races (round close, listing accept, ROFR response, mark-sold).
- **Scale envelope:** Tested workloads up to ~5k workspaces, ~50k cap-table rows, ~10k listings. v1.3 target: 100k workspaces. JSONB scan fallbacks (e.g. `type_data` filters) are flagged for column promotion as they show up in usage data — `seeking_type` was promoted in v0.3.0.0 for this reason.

### 6.2 Security & Compliance

- **Encryption:** TLS 1.3 in transit (Vercel + Supabase managed). Encryption at rest via Supabase Postgres + Storage defaults.
- **Authentication:** Supabase Auth with email + password. v0.3.0.0 ships real password / email change. **v1.3 P0:** TOTP-based 2FA + active session list.
- **Authorization:** Postgres RLS on every table. `SECURITY DEFINER` RPCs check `auth.uid()` explicitly before bypassing RLS for write paths. `user_can_access_workspace(ws_id)` helper centralises the membership check.
- **Audit trail:** `audit_events` is append-only via RLS (no UPDATE / DELETE policies). Marketplace + Connections + Financing-round + cap-table-mutation entity types are additionally protected by an immutability trigger (`audit_events_block_marketplace_mutation`).
- **PDPL compliance (KSA Personal Data Protection Law):**
  - Right to access — `Download my data` (JSON dump of 10 data sources).
  - Right to erasure — `account_deletion_requests` table with 30-day-copy pattern. **v1.3 P0:** fulfilment cron job.
  - Lawful basis — explicit consent at signup; cross-workspace visibility is opt-in per row.
- **Sharia compliance:**
  - iSAFE is the primary instrument; identified by permanent green. New instruments require Turky (Sharia advisor) sign-off.
  - No interest-bearing instruments by default; convertible note discount handling deferred to v2.
  - Connections Hub (Exits + Partnerships) requires consult extension from Turky before public launch. **BLOCKING**.
- **CMA compliance:**
  - Bulletin-board model: no fund custody, no settlement, no payments. Closing happens off-platform.
  - Whole-company exit listings require go/no-go from Mahmoud (CMA contact). **BLOCKING**.
  - Capital-gains tax (ZATCA) handling is the seller's responsibility; surfaced in marketplace "how closing works" panel.
- **Equity-terms confidentiality:**
  - v0.3.0.0 ships UI-level gating of `equity_expectations` on partnership listings (only owner + accepted-inquiry inquirer see).
  - **v1.3 P1:** DB-level column split (`type_data_public` / `type_data_private`) closes the data-level loophole.

### 6.3 Supported Platforms

- **Web:** Latest 2 versions of Chrome, Safari, Edge, Firefox. Mobile Safari iOS 16+. Chrome Android 13+.
- **Languages:** English + Arabic, both first-class with full RTL on every surface.
- **Currencies:** SAR-native throughout. v1.3 considers multi-currency display.
- **Timezones:** User-selectable in Settings (13 common values + UTC). Defaults to Asia/Riyadh.
- **Native apps:** Out of scope. Web is the only client.

### 6.4 Accessibility

- WCAG 2.1 AA target on every shipped surface.
- Keyboard navigation on ⌘K combobox, notifications popover, sidebar expansion, and form controls.
- ARIA landmarks + labels on header / sidebar / main content.
- Color tokens audited for ≥4.5:1 contrast against papyrus background.

---

## 7. Assumptions, Risks & Dependencies

### 7.1 Assumptions

- **A1:** KSA founders are using modern browsers on reasonable hardware. No IE11 support, no <1024px-wide desktop optimisation.
- **A2:** Sharia advisor (Turky) can clear new transaction types (exits, partnerships) within a normal scoping-call timeline. The original consult covered the secondary share marketplace only.
- **A3:** CMA bulletin-board interpretation remains stable. The platform stays out of broker-dealer scope as long as no fund movement happens on platform.
- **A4:** Samir (Probuy founder) will accept a named public exit listing. The design doc justified named-only on the grounds that anonymisation is impossible.
- **A5:** The verified-data moat is real — investors and acquirers will prefer cap-table-anchored listings over anonymous AngelList / Acquire.com profiles.
- **A6:** Bilingual EN/AR is a competitive advantage, not just a feature. KSA founders default to mixed English-Arabic communication; product surfaces must support both.

### 7.2 Risks

| Risk | Likelihood | Impact | Mitigation |
| :--- | :--- | :--- | :--- |
| **R1 — Samir says no to public named exit listing** | Medium | Pauses exit listing type | Partnership listings ship independently; anonymous tier goes on v2 roadmap if Samir's signal generalises |
| **R2 — Turky / Mahmoud surprises (Sharia or CMA flag)** | Medium | Delays Exit Hub public launch | Both consults are scoping calls, not full audits. Frame: "we extend the bulletin-board pattern; same off-platform-closing model." |
| **R3 — Cold-start (<5 listings by day 30)** | Medium | Premise 1 disproved | Founder manually seeds 8-10 listings from existing network before public launch |
| **R4 — Resend email delivery fails on accept** | Low | Acceptance state visible in UI but inquirer doesn't get contact email | Server action surfaces `emailWarning` to owner; owner copies contact details manually |
| **R5 — Equity-terms UI gate bypassed by direct JSONB query** | Low (v0.3.0.0); Closed (v1.3) | Sensitive negotiating terms leaked | UI gate buys time; v1.3 P1 ships the DB-level column split |
| **R6 — Account-deletion request without fulfilment cron** | Medium | KSA PDPL Article 32 (right to erasure) gap | Request pattern shipped; v1.3 P0 wires the 30-day scheduled job |
| **R7 — Notification preferences ignored by email delivery** | Medium | User-trust gap; muted categories still spam | Preferences shipped; v1.3 P0 wires enforcement in `lib/email/*` |
| **R8 — Two parallel inquiry accepts** | Very Low | Race condition | `FOR UPDATE` lock in `accept_connection_inquiry` RPC; second caller gets "already accepted" |
| **R9 — Data-room token forwarded by inquirer** | Low | Third party gets scoped access | TTL (default 14d, max 90d) + revocable `is_active`; same risk profile as the existing share-link mechanism |
| **R10 — Sharia ruling shifts on iSAFE structure** | Very Low | Wedge instrument invalidated | iSAFE is reviewed; deviating from Turky's scope requires re-consult |

### 7.3 Dependencies

| Dependency | Type | Current state | Blocks |
| :--- | :--- | :--- | :--- |
| **Supabase** (Postgres 17, Auth, RLS, Edge Functions) | Infra | Stable. Project `ezfvurrngphgwppnskus`. | Everything |
| **Vercel** | Infra | Stable. Production branch `claude/activate-bypass-permissions-0sjk1`. Live at https://venture-path.vercel.app/ | Everything |
| **Resend** | Email delivery | Wired. `RESEND_API_KEY` configured. | Inquiry handshake emails, investor updates, ROFR notifications, compliance reminders |
| **Turky** (Sharia advisor) | Regulatory | Consult extension required for Exit + Partnership Hubs | Public launch of Exit Hub; nice-to-have for Partnership Hub |
| **Mahmoud** (CMA contact) | Regulatory | Go/no-go required for Exit Hub | Public launch of Exit Hub |
| **Samir** (Probuy founder) | Persona | Confirm acceptance of public named exit listing | Exit Hub seed |
| **Saif** | Persona | Continuous follow-up on partnership listings | Partnership Hub seed |
| **Stripe / HyperPay** | Billing (future) | Not engaged. Decision blocked by KSA payment-rail choice. | Paid-plan launch (v1.3 P1) |
| **OAuth providers** (Google / LinkedIn / Apple) | Auth (future) | App registration not started | v1.3 P2 OAuth wiring |

---

## 8. Release & Rollout Plan

### 8.1 Release Ledger

```
v0.1.0   (2026-05-15) Initial prototype: cap table, ESOP, governance, valuation,
                       vault, traction, investor updates, secondary share
                       marketplace (Approach A bulletin board).

v0.2.0.0 (2026-05-16) Connections Hub launch: Exit Hub + Partnership Hub. 22-case
                       pgTAP suite. Connection inquiry handshake with one-step
                       accept + scoped data-room signed token. Bidirectional exit
                       ↔ share_listing collision rule.

v1.1     (2026-05-16) Surface restructure: hubs surfaced as top-level sidebar
                       entries. /messages routing inbox. /settings + /profile.
                       Marketplace Browse (Trading × Exit co-location). Rounds
                       Browse (Investment cross-workspace). Talents + Advisors
                       seeking filters. Split-layout auth pages.

v0.3.0.0 (2026-05-17) Cross-workspace activation + UX hardening:
                       + close_financing_round RPC (atomic apply)
                       + is_public toggle (rounds + share listings + ROFR gate)
                       + account_notifications table + 4 triggers + bell wiring
                       + Full-text search (tsvector + GIN + RPC + ⌘K dropdown)
                       + investor_update_recipients + per-recipient open tracking
                       + Transfer-agent cap-table sync on secondary sale
                       + acquisition_models + compute_acquisition_model RPC
                       + seeking_type promoted to first-class indexed column
                       + UX hardening (6 batches, 20 audit items): sidebar
                         reliability + persistence, profile completeness,
                         settings depth, shared UI hygiene, dilution validation,
                         threaded messaging, equity-terms gating
```

### 8.2 v1.3 Backlog (target 2026-Q3)

**P0:**
- Real 2FA + active session management
- Notification-preference enforcement in email delivery
- Account-deletion fulfilment cron (30-day scheduled job)

**P1:**
- DB-level equity-terms split (`type_data_public` / `type_data_private`)
- Stripe / HyperPay billing rail + paid plan launch
- Sender-side notification trigger on inquiry-message reply

**P2:**
- OAuth providers (Google / LinkedIn / Apple) wired
- Search expansion to investor_updates / term_sheets / audit_events
- Hijri-calendar-aware compliance obligations (Zakat dates)
- Investor-specific landing aggregating "rounds I've invested in" cross-workspace

### 8.3 Rollout Strategy

**Pre-launch (v0.3.0.0 — current):**
- Production-live at https://venture-path.vercel.app/.
- Soft-launched: sidebar entries visible, no founder outreach yet on Exit Hub.

**Soft launch (post v1.3 P0 close-out):**
- Resolve Turky + Mahmoud + Samir blockers.
- Manually seed 8-10 listings from founder's existing network.
- Open to 50-100 founders in the founder's known KSA network. No public announcement.
- Watch Day-7 / Day-30 metrics (K1, K2, K3) and inquiry handshake completion rate.

**Public launch:**
- Announcement on founder's channels.
- Open `/connections`, `/marketplace`, `/rounds` Browse tabs to every signed-in user.
- Monitor Day-30 / Day-90 success criteria against the kill criteria in §2.3.

**Kill switch:**
- Per hub: deprecate the sidebar entry via feature flag (`sidebar.tsx`), withdraw all listings via the `withdraw_*` RPCs.
- Whole platform: rollback the production branch to v0.2.0.0.

### 8.4 Communication

- **Release notes:** `CHANGELOG.md` + a per-release sell-test summary in the PR body.
- **User-facing changelog:** None yet. v1.3 candidate.
- **Status page:** None yet. Vercel monitors uptime; manual notification via founder's channels on incidents.

---

## 9. Glossary

| Term | Definition |
| :--- | :--- |
| **iSAFE** | VenturePath's Sharia-compliant convertible instrument. Permanent green identity (`DESIGN.md` §3.6). |
| **Workspace** | The unit of equity ownership. One workspace = one company = one cap table. |
| **Public profile** | A workspace with `public_profile_published=true` and a slug — discoverable on `/explore`. |
| **Exit listing** | A `connection_listings` row with `listing_type='exit'`. Whole-company sale / acqui-hire / merger. |
| **Partnership listing** | A `connection_listings` row with `listing_type='partnership'`. Co-founder / advisor / senior hire / business partner. |
| **Secondary listing** | A `share_listings` row. An existing shareholder posting part of their equity for sale. |
| **Open round** | A `financing_rounds` row with `status='open'` and `is_public=true`. Discoverable on `/rounds` Browse + `/explore`. |
| **ROFR** | Right of first refusal. Existing shareholders are notified on a new secondary listing and can exercise / decline. |
| **Data room token** | A signed time-limited link granting scoped read access to a workspace's vault, without granting workspace membership. |
| **Off-platform closing** | Every transaction is executed off-platform via lawyers + registry. VenturePath provides structured data + contact reveal; never holds funds. |
| **Inquiry** | A `connection_inquiries` row. Structured "I'm interested" message with one-step owner accept. |
| **PDPL** | KSA Personal Data Protection Law. |
| **ZATCA** | Zakat, Tax, and Customs Authority. |
| **GOSI** | General Organization for Social Insurance. |
| **MOC** | Ministry of Commerce. |
| **SAMA** | Saudi Central Bank. |
| **CMA** | Capital Market Authority. |

---

## 10. Appendix — Companion Documents

- **`docs/prd-venturepath-deep-dive.md`** — Hub-by-hub architecture (§6 each hub: purpose, primary user, feature table, data model, status); platform layer detail; v1.2 cross-workspace activation + UX hardening delta (§13.1-§13.17 — features delivered, requirements satisfied, user stories per shipped item).
- **`docs/prd-connections-hub.md`** — Exit + Partnership Hubs deep-dive: schema (§5.1), inquiry handshake state machine (§5.2), collision rules (§5.3), cross-workspace RLS (§5.4), audit trail (§5.5), 12 design decisions (§6), architecture diagram (§7), failure modes (§8), test coverage (§9), v1.1 surface restructure (§18), v1.2 updates (§19).
- **`DESIGN.md`** — Kinetic Sovereign design system.
- **`CHANGELOG.md`** — versioned release history with the sell-test rubric applied per entry.
- **`TODOS.md`** — open work + external blockers + closed-item log.
- **`AGENTS.md`** — agent configuration for Claude Code + skills used in development.
