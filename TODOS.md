# TODOS

Deferred work captured during reviews. Each item has enough context that
someone picking it up in 3 months can resume without re-deriving the
motivation.

## Open

### Sharia advisor consult — scoped to Approach A bulletin board

**What:** Ask VenturePath's existing Sharia advisor whether a
workspace-scoped bulletin board (posted ask prices, off-platform closing,
no escrow, no money movement on platform) raises gharar (uncertainty) or
qabd (possession-transfer) concerns. The design doc's original Sharia
gates assumed Approach B (full marketplace with escrow). Approach A may
pass with a much smaller advisor scope.

**Why:** The original design doc lists qabd and gharar as open Sharia
concerns. Bulletin-board scope removes the escrow account (the qabd
concern's main trigger) and removes auction-style price discovery (the
gharar concern's main trigger). One scoping call confirms.

**Pros:** Founder's existing Sharia-advisor assignment shrinks from a
full marketplace audit to a single scoping consult. Clears Sharia gate
for Approach A in days, not weeks.

**Cons:** Adds one advisor touchpoint. Advisor may surprise us with a
new concern specific to posted-ask boards.

**Context:** Approach A was selected after /plan-eng-review and an
outside-voice challenge on 2026-05-16. The original Approach B is
shelved pending broker LOI and full Sharia audit. The advisor was
originally going to be asked about Approach B; reframe the request.

**Depends on:** Founder's existing relationship with the Sharia advisor
who signed off on the cap-table product.

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

### Broker-dealer exploratory call — Mahmoud

**What:** Exploratory call with Mahmoud (CMA-licensed broker-dealer
contact) to scope what a future Approach B partnership looks like. Not
LOI-gated — no commitment. Goal: understand the broker side of the
integration (KYB requirements, escrow account structures, settlement
timelines, fee ranges).

**Why:** Approach B's hardest gate is the broker LOI. We are not signing
yet, but knowing the shape of that partnership lets us design Approach
A's data model so a future migration to B is incremental, not a rewrite.

**Depends on:** Nothing — runs in parallel with Approach A
implementation.

**Contact:** Mahmoud.

---

## Closed

(none yet)
