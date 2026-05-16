# Changelog

All notable changes to VenturePath will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to a 4-digit version scheme: `MAJOR.MINOR.PATCH.MICRO`.

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
