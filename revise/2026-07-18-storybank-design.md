# Storybank — design record (2026-07-18)

**Status:** data model and behavioral rules SETTLED. Surface design (format, content,
memory render) NOT designed. **Do not build UI from this document.** Items in
§8 are open forks; if you need one to proceed, stop and ask.

---

## 0. Routing note — read first

**This is a design record, not a build prompt.**

§1–7 are settled enough to implement: data model, provenance tiers, deletion,
extraction, anchors. §8 is not.

You can build today: the storage layer, tier machinery, tombstones, and the two
delete doors (`remove` / `erase`).

You cannot build: the surface. Format, content, and memory render were never
designed. Do not invent them.

**Blocking question — answer before starting: fork #1 (global delete vs.
per-question demote).** This is not a UI question, it changes the schema. If demote
exists, deletion is global and preference is a per-question scoped relation between
claim and question. If it does not, a claim's presence is binary. You will hit this
in the first hour.

---

## 1. What storybank is

A **memory/selection tool** — an individual 素材库 (material library) that
continuously self-updates and self-filters. Its purpose is confidence: helping the
user find their value, uniqueness, and competitive edge.

It is one of **three parallel end products**, not a pipeline stage:

| Artifact   | Owner          | Contents |
|------------|----------------|----------|
| Storybank  | System + user  | Material library. Self-updating. Exportable, deletable. |
| Notes      | User           | Freeform. User writes whatever they want, optionally per-stage. |
| Cheatsheet | Coach          | Question map + hints/suggestions + things to be mindful of. |

**Correction to earlier framing:** storybank is NOT "what you pour in" with
cheatsheet as "what comes out." They are separate artifacts with different authors.

### What it is NOT (settled)
- Not a front-door step, not a fourth stage in the flow.
- Not a reflective open-ended questionnaire asked cold.
- Not a *wall* — where "wall" means a blocking step in the linear flow. A
  non-blocking destination is permitted.

### Inputs
- **Seeding:** resume + job description (auto-extract on entry).
- **Diagnostic:** Q1 background answer, optional ungraded "didn't fit" answer,
  front-door "hardest part for you."
- **Drills:** spoken takes, survival of pushback.
- **Mock:** spoken takes.

Material becomes more solid and personal as it moves through spoken stages. Dig
sparks provide inspiration into storybank; the user can always track back to check it.

---

## 2. Unit of storage

**Claim + evidence**, not story. A story is one rendering of a claim.

Rationale: the same material serves different questions with different emphasis and
beat order. Storing raw stories makes the user repeat a paragraph verbatim across
questions, which reads as rehearsed.

**The user sees both layers** — claims and their evidence — and makes keep/delete
decisions across both.

---

## 3. Provenance (settled)

Every entry carries an origin tag. Provenance is a **tier that a claim moves through**,
not a static label:

1. `lifted-from-resume` / `lifted-from-jd`
2. `offered-by-dig` (a spark the user banked — banking borrowed material is the
   user's right, per the dig spark-stance decision)
3. `said-aloud` (spoken in a drill or mock)
4. `survived-pushback`

**Tier is visible to the user.** Tier 4 is the honest version of "you're ready for
this one" — the system never judges whether a memory is impressive, only whether the
user has defended it out loud.

### Rules
- Provenance never blocks and never prompts a checkpoint. There is no provenance
  gate (rejected — spark stance).
- Confirmation gates **entry into the bank**, never **tier movement**. `said-aloud`
  and `survived-pushback` are system-observed facts. A user must not be able to
  confirm their way into a tier they did not earn.
- One hard line survives from spark stance: the system may never assert an unclaimed
  fact as the user's own history.

---

## 4. Extraction and promotion

- Extraction from transcripts is **user-confirmed promotion**, not automatic.
- **Batched at end of drill**, not per take. Prompt shape: "three things came up,
  keep any?" One decision point, after the take is over, when the user is out of
  performance mode and can see the take as a whole.

Note for sequencing: storybank ships **before** the speak-runner. At ship time the
only live feeds are seeding and the diagnostic — a thin, mostly-borrowed bank. The
transcript-extraction path must be designed now even though it will have little to
consume until the speak-runner lands.

---

## 5. Deletion

**Two doors:**

- **Remove (soft delete).** Claim leaves the bank view; the record persists.
  Tombstoned. Unedited cheatsheet references still resolve. Required for the
  re-offer behavior below.
- **Erase (hard delete).** Text purged, no tombstone, never asked about again.
  Accepts that the same material may be re-extracted fresh in future.

Rationale for two doors: some deleted material is genuinely sensitive (health, a
firing, something regretted in a drill). A system that cannot forget on request is a
bad promise for something the user pours their life into. `erase` does not need to be
prominent, but it must exist.

**Tombstone behavior:** do NOT ask at delete time whether similar material should be
re-added later — the user cannot evaluate a hypothetical. Delete silently, remember
the deletion, and if a near-identical claim appears in a later transcript, ask *then*,
with the real text in front of them: "you removed this before, it came up again —
back in?"

---

## 6. Strength anchor (selection)

When multiple claims could answer the same question, storybank surfaces options with
rationale and **the user chooses**. The system does not pick for them.

### Hard line
Strength is **never absolute merit**. Never "this experience is more impressive."
Only coverage of something external and checkable: "this one touches three things the
posting names; the other touches one." The user overrules a mapping, never a verdict
on their life.

### Anchor set (all four permitted)
| Anchor | Kind |
|--------|------|
| Job description | Quotable text — checkable |
| Company material | Quotable text — checkable, **only if sourced from real company material**, not the model's impressions |
| Seniority | Inference — the model's theory of interviewing |
| Round | Inference — the model's theory of interviewing |

**Labeling requirement (seam rule):** checkable and inferred anchors must be visibly
labeled differently. If shown with identical framing the user cannot tell which is
grounded — and "let the user choose" silently becomes "let the model's interviewing
opinions steer, wearing evidence's clothes." Inferred anchors must never outrank a
checkable anchor in default ordering.

---

## 7. Cheatsheet binding

**Not in storybank v1.** Storybank ships standalone; binding lands with the
cheatsheet build.

When it does land, the model is **seeded-then-owned** (copy-on-edit):

- Cheatsheet generates a default that references bank material.
- The moment the user edits a line, that line is theirs and stops tracking the bank.
- Unedited lines continue to reference the bank; soft delete guarantees they still
  resolve.

The user can change the default cheatsheet before exporting. This is independent of
storybank deletion.

---

## 8. Open forks — NOT SETTLED

Do not resolve these by guessing. Ask.

1. **Delete: global vs per-question demote.** Claims live in one bank and surface
   across questions. Deleting a claim to express "not my best for *this* question"
   destroys it everywhere — but it may be the strongest material for a different
   question. Does `demote / not-here`, scoped to one question, exist alongside global
   delete? Leaning yes, undecided.
2. **Format.** Questions vs hints vs clicks vs conversation. Direction agreed:
   **generate-then-react, not ask** — an empty inspiration station is a
   confidence destroyer, and a chat box saying "let's brainstorm your value" is the
   rejected questionnaire in a new hat. Open the surface already populated with
   provisional material the user reacts to. Rejection options should route
   (`not me` / `close but wrong` / `true but boring`) so the ask comes for free and
   targeted — the user never faces a blank prompt. **The actual surface is undesigned.**
3. **Content.** What it surfaces to get at value/uniqueness/edge. The earlier example
   questions ("most challenging moment") were explicitly rejected. The real set is
   unwritten.
4. **Memory render.** How "one idea answers multiple questions" appears in the UI.
   Does a stored claim show as a dig hint on every relevant question? Does the user
   browse their bank? Where does it live?
5. **Where it sits.** Rides on dig (behavior) but was described as a place
   ("inspiration station"). Leaning: Toolbox-rail surface whose contents also surface
   as per-question dig hints — same duality as Notes today. Not settled.
