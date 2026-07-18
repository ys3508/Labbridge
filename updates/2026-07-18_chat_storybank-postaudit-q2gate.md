# Chat session record — 2026-07-18 (storybank reconciliation · post-audit routing · Q2 gate runs 1–3)

**Companion to `2026-07-18_CC_diagnostic-triage-intake-nav.md`.** That file records what CC
built. This file records what was *decided* and what the live gate runs *found* — the
reasoning behind several commits in that handoff, plus findings that are not yet in any
commit.

Lane note: this session was advisory only. No code written here. Everything below was
either routed to CC/Codex as a prompt, or is awaiting a decision.

---

## 1. Storybank ↔ ADR-0006 reconciliation — SETTLED

Shipped by CC as `bad2418` (docs only). The reasoning, so it does not get re-litigated:

**Problem.** Storybank derives claims from the same transcripts ADR-0006 deletes.
Consequence 1 forbids silent survivors. Granularity also collided — delete is per plan,
the bank is per user.

**Resolution: tier is derived, not stored.** A claim's provenance tier is a fold over
plan-stamped provenance events, computed at read time as `max(event.tier)`. Deleting a
plan deletes that plan's events; tier recomputes downward because the record that observed
it is gone. This is the only tier movement storybank §3 permits — a user cannot confirm
their way up and cannot argue their way down.

**Settled alongside it:**
- Bank is per user; delete is per plan; a claim survives a plan delete iff it retains ≥1
  event outside that plan. Neither granularity had to move.
- Plan delete is **erase-strength** (purges, no tombstone, no re-offer). ADR-0006 exists
  for the rough layoff answer; a delete that quietly returns material breaks its premise.
  Storybank's `remove`/`erase` stay claim-scoped.
- Resume is a **per-user artifact**. `lifted-from-resume` events carry a null plan and
  survive every plan delete; `lifted-from-jd` stays plan-stamped. Consequences: the resume
  needs its own user-reachable delete path (it is a writer under the checker rule), and
  resume delete cascades to its claims, which hold exactly one event each.
- Delete confirmation names lost claims and their count, alongside the lost "before"
  snapshot. Loss register, not deterrent.

**Closed as a result:** storybank scope (per-user); deletion-model unification.
**Still open:** storybank fork #1 (global delete vs. per-question demote) — untouched,
schema-shaped, blocks the storybank build's first hour. §8 forks 2–5 remain undesigned.

---

## 2. Post-audit routing decisions

From CC's Diagnostic + Triage audit. Decisions made here, then routed:

| Item | Decision |
|---|---|
| Q2-relevance gate | Run it first. Everything downstream compounds on the diagnostic read. |
| Trust copy | **Gates drill, not Session B.** CC's table had this wrong. The moment drill lands (multiple takes, retained takes, pauses scored) plus storybank's per-user bank, the standing save line describes a system that no longer exists. Drafted, awaiting approval. |
| ADR-0006 deletion path | Stay deferred. There are now **three doors** (plan delete, resume delete, claim remove/erase) — building the plan door alone means designing a surface that gets redesigned. |
| G7 — Q1 tone default | Close as neutral, recorded as a **rule not a fallback**: *tone dials on evidence, not on arrival.* Q1 is the cold opener; warmth unearned by anything reads as product voice. → ADR-0007. |
| G2 — flat-line copy | Leave. Walk-in-card renderer, not Triage. |
| Per-dimension expectation plant | **The spec was wrong and the code was accidentally right.** Triage exists to narrow to one lever; rendering expectations per-dimension re-broadens what the stage just narrowed. Amend `triage-spec.md` to top-dimension only, with rationale inline. |
| Triage stale-restore | CC's first fix (`399d885`) gated on *override-ness*; the failure axis is *staleness*. Needs a fingerprint of the diagnostic read in the key. Redone in `0a1ab06`. |

**Standing observation, worth watching:** two behavioral branches shipped to `main`
untested (`399d885`, `0464cc3`), each with sound reasoning (don't burn paid calls), each
inside an audit that declared the area done. The triage one was declared fixed and wasn't.
Spend is now pre-approved for live verification on the queued task.

---

## 3. Intake back-navigation — stale Q2 answer decision

When a user returns to intake and materially changes the JD or resume, Q2 is re-derived and
any answer given against the old Q2 is stale.

**Decision: discard, with acknowledgment.**

Options "keep" and "re-offer" both treat the old answer as an answer to *this* question,
and it is not — Q2 changed. Feeding it forward grades the user on a question they were
never asked; that is the silent-survivor failure mode on a different surface.

**Why this differs from the triage stale-restore, deliberately:** there the artifact is a
priority *ordering* and only the input changed — same object, new read, so re-offering the
user's correction is coherent. Here the *question* changed; there is nothing to re-offer.
Two seams, two answers, and that is correct rather than inconsistent. Recorded so nobody
"unifies" them later.

**Acknowledgment, not silence.** One line at the point of change, loss register, no
apology, no deterrent, no dialog. Q1 kept unconditionally and needs no flag.

---

## 4. Q2-relevance gate — runs 1–3 scored. **GATE DOES NOT PASS.**

Fixtures in `revise/q2-gate-jd-fixtures.md`. Resume held constant (Ryan Wang, IB analyst,
~2 yrs). Only the JD varied.

### Criterion 2 splits in two — a structural finding, not a score

Run 1 proved these are different guarantees:
- **2a — verbatim.** The quoted string is real.
- **2b — attribution.** The string is in *the document the receipt names*.

Run 1 passed 2a and failed 2b, and 2a alone reads as clean. Score them separately in
`validation-notes.md` from here on. Criterion 1 likewise has three outcomes, not two:
generic-from-title, sourced-from-resume, sourced-from-posting. Only the third passes.
Criterion 3 is **unscoreable (N/A)** when the question is resume-derived — a question about
a deal you personally ran is a freebie by construction, so it wasn't tested rather than
failed.

### Run 1 — THIN — FAIL (1, 2b)

> Walk me through one of the transactions you worked on at G2 Capital—take me from the
> initial brief through to what you built or recommended, and what surprised you along
> the way.
>
> From the posting: "Execute middle-market sell-side M&A and strategic advisory engagements"

The receipt string is **not in the JD**. It is verbatim from the resume (G2 Capital bullet
1), correctly quoted, **mis-attributed to the posting**. The guard verifies a quote is real
but not that it came from the document it names. The honest-generic fallback did not fire on
a thin JD — the model reached into the resume instead.

### Run 2 — DENSE — Pass 1, 2b · marginal 2a · **FAIL 3**

> Walk me through how you'd build a three-statement operating model for a $5MM EBITDA
> industrial services business we're evaluating, and what key drivers would you
> stress-test to understand downside scenarios.
>
> From the posting: "Build three-statement operating models and returns analyses at the
> unit and location level."

Criterion 1 is a clean pass and it **localizes run 1's bug**: "$5MM EBITDA industrial
services" is synthesized from the overview line and falls correctly inside the posting's
$3–12MM range. Two posting lines combined, no resume intrusion. **So the resume does not
beat a real posting line** — run 1 is specifically a thin-JD fallback failure, not a general
resume preference.

Criterion 3 fails: the resume shows a region-by-region three-statement model for a 115-unit
franchisee with closure scenarios and base/upside cases. The question asks the user to do
the thing they already do. The generator picked the **overlap**, not the gap — and the
buried QoE / working-capital-peg line, which the resume does not cover, went untouched.

### Run 3 — TITLE DISAGREES — Pass 1 (strongest), 2b, 3 · marginal 2a

> Walk me through how you'd approach building weekly KPI reporting for an operating
> company that's never had formal management reporting—what would your first week on-site
> look like, and how would you handle incomplete data?

Title said deal execution; body said operations; question is entirely operations. No
split-the-difference. Criterion 3 passes — but **only because that posting body happened to
have no overlap with the history.** Luck, not design.

### Cross-run findings

- **Truncation is consistent.** Runs 2 and 3 both quoted a correct prefix and dropped
  trailing material (", including add-on integration scenarios" / "of any kind"). Meaning
  unaltered. Not the stitch-or-qualifier-drop failure. This drove the match-strictness
  decision below.
- **Criterion 4 nit:** the permission line is identical across all three runs — not dialed
  at all. Also, the header "the one you might not" followed by "you might not be able to
  answer this yet" says the same thing twice in two lines; once is permission, twice starts
  to read as anticipating failure. Folded into the trust-copy draft.
- **A fourth JD shape the spec doesn't name:** the real Heritage posting is **long but
  sourceless** — eight responsibility bullets, no named sector, size, thesis, or technical
  specific. It presents as rich while offering nothing quotable, so a generic Q2 against it
  produces a false pass on criterion 1 with no signal. Likely the most common shape in the
  wild.

### Runs 4–5: HELD

They vary seniority with the same JD. The current reuse guard keys on JD and resume only,
so they will hit the reuse path and return the previous Q2 unchanged — logging a pass on a
run that never ran. Run them after the fingerprint lands.

**Re-run 1–3 after the receipt fix.** The gate isn't shipped until a clean sweep.

---

## 5. Reframe: what the gate is actually for

Sissi's framing, and it improves the finding: **Q2 is a test instrument; the question map is
the product.** Skipping Q2 stays supported and is not encouraged.

Under that framing, run 1's failure is not really a Q2 failure. The landing page promises
*every question traced to a line of the posting* — that is the question map's core claim,
running on the same receipt machinery at roughly ten times the surface area. The gate found
a **receipt-guard bug in the thing that matters most, cheaply, on the surface that matters
less.** Fix at the guard level, not in Q2's prompt. Do not over-invest in Q2 question
quality; do keep running the gate as early detection for the map.

---

## 6. Queued for CC — `revise/2026-07-18-reuse-fingerprint-and-receipt-attribution.md`

Three items, spend pre-approved for live verification:

1. **Reuse guard: fingerprint the normalized `/api/intake` payload**, do not enumerate
   fields. A hand-maintained field list is a bug scheduled for the next payload change.
   Normalize by trim + collapse internal whitespace, nothing else. Tune conservative — a
   false re-fetch costs 1–2¢; a false reuse contaminates a gate run.
2. **Split the discard predicate from the re-fetch predicate.** Re-fetch on payload change;
   discard **only if the new Q2 text differs from the old**. A seniority bump may return an
   identical Q2, in which case the prior answer is still valid. Named edge case: if Q2 was
   **skipped**, no discard and no acknowledgment line.
3. **Receipt guard: verify attribution, not just quotation.** Must find the string in the
   document the receipt *names*. On failure the honest-generic fallback fires — do **not**
   relabel the receipt to point at whichever document the string was actually in, since the
   question itself came from the wrong source. Step 1 is investigate-and-report: is the
   guard shared with the question-map path or are there two implementations?

**Match strictness (decided): contiguous substring after normalization.** Exact-match would
fail every benign truncation and destroy real receipts. Contiguous still catches stitching
for free — a receipt welding two non-adjacent lines is not contiguous in the source.

**Shared helper:** items 1 and 3 plus the triage diagnostic-read fingerprint all need
normalized-text comparison. One helper, three uses.

---

## 7. New OPEN.md forks from this session

- **Q2 derivation — posting-only vs. collision (gap-targeted).** Routed to Codex as a
  record-only append. Evidence is run 2: posting-only derivation cannot reliably satisfy
  "answerable-but-stretching" because it has no way to know which posting demands the user
  already owns. Candidate shape: posting-anchored receipt, gap-targeted question — *"the
  posting has the associate owning QoE end to end; your resume shows modeling and IC
  materials but no QoE — walk me through how you'd run one."* Distinct from run 1's failure,
  where the resume was used *instead of* the posting and mislabeled as it. **Likely applies
  to the question map too.**
- **Storybank re-offer on re-seeding.** §5's tombstone re-offer was specified for
  transcripts. Replacing a resume is a non-transcript feed that also re-extracts. Behavior,
  not schema — does not block the storybank build.

---

## 8. UX items from live testing — raised, not yet routed

1. **No in-app back door from diagnostic to intake** — shipped in `0464cc3`.
2. **Intake state survives back navigation** — shipped in `0464cc3`.
3. **"The hardest part of this, for you" — add clickable options plus an "other" blank.**
   Not routed. *Noted cost:* this is one of the few places the user speaks unprompted. Presets
   make it faster and easier to route, but most users will click rather than write and you
   stop hearing the thing you didn't anticipate. "Options + other" is the reasonable
   compromise; the cost is real and this is the field least able to afford it.
4. **Resume upload should accept a PDF.** Not routed. *Noted consequence:* the resume is now
   a per-user artifact with its own delete path under the ADR-0006 amendment. Accepting a
   file means storing a file — a new writer, and the checker rule fails the build on a writer
   with no corresponding delete. Whether the PDF persists or only extracted text does is a
   schema question, and it is cheap now. *Second consequence:* resume text is now hashed into
   the intake fingerprint, so if PDF text extraction is not byte-stable across extractions,
   every intake touch re-fetches.

---

## 9. Live blockers, in order

1. **Q2 gate does not pass.** Re-run 1–3 after the receipt-attribution fix; runs 4–5 held
   until the fingerprint lands.
2. **Trust copy gates drill**, not Session B. Drafted, awaiting approval.
3. **Storybank fork #1** — global delete vs. per-question demote. Schema-shaped, blocks the
   storybank build's first hour.
4. Storybank §8 forks 2–5 (format, content, memory render, placement) remain undesigned —
   do not invent them.
