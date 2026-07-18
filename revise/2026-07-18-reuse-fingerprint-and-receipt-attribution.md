# Implementation prompt — reuse fingerprint, discard split, receipt attribution (2026-07-18)

**For CC/Codex. You have zero context from the conversation that produced this. Read
this file, implement it, commit and push this file along with your changes.**

Builds directly on `0464cc3` (intake back-navigation + reuse guard). Three items.
Item 3 is the important one; items 1–2 unblock live validation runs.

---

## Item 1 — Reuse guard: fingerprint the payload, do not enumerate fields

**Goal.** The reuse-or-fetch guard shipped in `0464cc3` keys on JD and resume only.
Seniority and round also feed Q2 derivation, so today a user can change seniority, hit
Continue, and get a **reused bundle with Q2 still calibrated to the old level** — a
silently wrong question with no signal that anything went stale. This blocks the
Q2-relevance gate's seniority runs (`q2-relevance-gate-spec.md` criterion 3, and the
first-role / senior entries in its variation set): a run can hit the reuse path and
return an unchanged Q2 while the operator believes a new seniority was tested.

**Do not fix this by adding seniority and round to the field list.** A hand-maintained
list of inputs is a bug scheduled for the next time a field is added to the payload.

**Implement:** hash the exact normalized request body sent to `/api/intake`. Reuse the
existing bundle if and only if the hash matches; otherwise re-fetch. The guard then
cannot drift from what actually determines Q2 — any field added to the payload later is
covered without anyone remembering to update the guard.

**Normalization before hashing:** trim leading/trailing whitespace and collapse runs of
internal whitespace. Nothing else — no lowercasing, no punctuation stripping, no
semantic diffing. This removes the trailing-newline and re-paste-with-different-spacing
false positives without inventing a similarity threshold.

**Tuning direction:** conservative. A false re-fetch costs 1–2¢. A false reuse produces
a silently wrong Q2 and contaminates a gate run, where the operator then cannot tell
whether an odd Q2 came from the generator or from stale reuse. Never trade correctness
for pennies in this guard.

---

## Item 2 — Split the discard predicate from the re-fetch predicate

**Goal.** `0464cc3` uses one predicate for two different decisions. Re-fetching does not
imply Q2 changed. A seniority bump may return an identical Q2 string — in which case the
user's prior answer is still an answer to that exact question, and discarding it destroys
their work for no reason.

**Implement two independent layers:**

- **Re-fetch** when the payload fingerprint changes (item 1). Conservative.
- **Discard the prior Q2 answer and render the acknowledgment** only when the **new Q2
  text differs from the old Q2 text**. Precise.

Q1 continues to be preserved unconditionally — the fixed opener never changes.

**Named edge case, must be handled:** if the user **skipped Q2**, there is no prior answer
to discard and the acknowledgment line must not render. A skip followed by a JD edit must
not produce a message about losing an answer that never existed. Skipping Q2 remains a
supported path and is not being discouraged by this change.

---

## Item 3 — Receipt guard: verify attribution, not just quotation

**Goal.** This is the highest-value item here and it is not confined to Q2.

Live gate run 1 (thin JD) produced this receipt:

> From the posting: "Execute middle-market sell-side M&A and strategic advisory
> engagements"

That string does **not** appear in the job description. It is verbatim from the user's
**resume** (first bullet of their current role), correctly quoted, and **attributed to the
posting**. The guard confirms a quote is real; it does not confirm it came from the
document it names. Those are different guarantees and only one is implemented.

**Why this matters beyond Q2.** The product's standing promise is that every question is
traced to a line of the posting. The question map — not Q2 — is where that promise
carries most of its weight, and it presumably runs on the same receipt machinery at
roughly ten times the surface area. Fix this at the guard level, not by patching Q2's
prompt, or the map ships with the same defect.

**Implement:**
1. **Investigate first and report before changing anything:** is the receipt guard shared
   between the intake/Q2 path and the question-map generation path, or are there two
   implementations? Say which, in your reply. If they are separate, the fix goes in both,
   and note whether they should be unified (do not unify them in this commit).
2. The guard must verify the quoted string appears in the **specific source document the
   receipt names**, not in any provided document. Attribution mismatch fails the check.
3. On failure, the existing **honest-generic fallback** fires. Do not rewrite the receipt
   to point at whichever document the string was actually found in — the question itself
   was derived from the wrong source, and relabeling would hide that.
4. Matching runs on normalized text (the shared helper from Item 1), so whitespace
   differences between the stored document and the rendered receipt do not cause false
   failures. Strictness is specified in the addendum below.

**Regression note for run 1:** a thin JD with nothing quotable should have triggered the
honest-generic fallback. It did not — the model reached into the resume instead. After
this change, verify the thin-JD case produces the fallback rather than a resume-sourced
receipt.

### Item 3 addendum — match strictness (decided)

Live gate runs 2 and 3 both produced **truncated** receipts: the quoted string is a
correct prefix of a real posting line, with trailing material dropped and a period
substituted. Run 2 cut ", including add-on integration scenarios"; run 3 cut "of any
kind". Neither altered meaning. This is consistent behavior, not a one-off.

**Decision: contiguous substring match, after normalization.** The quoted string must
appear as an unbroken substring of the named source document.

- Exact-match would fail every benign truncation and fire the honest-generic fallback on
  otherwise-correct receipts. That destroys real receipts to prevent a lesser harm.
- Contiguous matching still catches stitching: a receipt welding two separate lines
  together is not contiguous in the source and fails by construction.
- Normalization is the shared helper from Item 1 — trim, collapse internal whitespace,
  nothing else.

Attribution (step 2 above) is unaffected: the substring must be found in the document the
receipt **names**, not in any provided document.

### Item 3 — regression fixtures from live runs

Add as zero-API assertions in `check-fixtures.mjs`:

- **Run 1 case:** a string present in the resume and absent from the JD, attributed to the
  JD, must FAIL the guard and produce the honest-generic fallback.
- **Run 2/3 case:** a correct prefix of a real JD line, attributed to the JD, must PASS.
- **Stitch case:** two non-adjacent JD lines concatenated must FAIL.

---

## Shared helper

Items 1 and 3 both need normalized-text comparison, and the open triage stale-restore
work (`revise/2026-07-18-post-audit-cleanup.md`, item 2) needs the same concept for its
diagnostic-read fingerprint. Implement **one** normalization + fingerprint helper and use
it in all three places as they land. One concept, one implementation, one place to be
wrong.

---

## Testing

- Zero-API assertions in `check-fixtures.mjs` for: fingerprint stability under whitespace
  normalization; fingerprint change on a seniority-only edit; discard-vs-refetch split
  (same payload change, identical Q2 → no discard); skip-Q2 → no acknowledgment; and the
  three receipt-guard regression fixtures listed under Item 3.
- The receipt-guard behavior and the discard acknowledgment are the two branches that have
  now shipped or would ship untested. **Spend the API budget to drive them live** (~3–5¢).
  Two untested behavioral branches have already accumulated on `main` (`399d885`,
  `0464cc3`); do not add a third. If a live run requires approval for spend, ask.

## Not in scope

- Do not change Q2's prompt or question-generation quality. Q2 is a diagnostic instrument;
  the question map is the product.
- Do not unify the receipt guards in this commit if they turn out to be separate — report
  and stop.
- Do not touch the acknowledgment copy's register. It belongs to the open trust-copy draft.
- Do not build the storybank, the ADR-0006 deletion path, or the triage fingerprint here.
- Do not act on the Q2 derivation fork (posting-only vs. gap-targeted) in OPEN.md. It is a
  design question, not a build task.

## Convention

JOURNEY.md entry in the same commit.
