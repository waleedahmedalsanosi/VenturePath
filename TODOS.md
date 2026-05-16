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

## Closed

(none yet)
