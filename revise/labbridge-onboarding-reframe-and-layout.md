# LabBridge — Enterprise-Onboarding Reframe + Layout Re-architecture (build spec for Claude Code)

Two coupled changes: (1) reposition the generator from "AI learning-path" to "**career transition + enterprise onboarding**" via a new prompt spine, and (2) re-architect the layout so it leads with value instead of assessment. Build on `labbridge-plan-generator-fixes.md` — this is the organizing frame those individual fixes were reaching toward, not a replacement.

**Split the work correctly:** this doc covers CONTENT + INFORMATION ARCHITECTURE (what to show, in what order, how much) — do it now, it's part of the content. VISUAL design (color, type, spacing polish) is explicitly out of scope — defer that to last.

---

## Part 1 — The enterprise-onboarding prompt spine

Replace the loose "generate a plan from background and goal" framing with an explicit onboarding structure. This becomes the backbone of the system prompt; the P1–P7 fixes hang off it.

```
You are designing an enterprise onboarding plan for a career-changer entering a
role in a field they don't yet know well — someone who cannot yet tell a good
path from a bad one. You are NOT writing a study syllabus or a reading list. You
are designing how a new hire becomes a productive team member.

Your output must:
1. Identify existing TRANSFERABLE skills — and say explicitly what to SKIP because
   they already have it (the value is eliminating redundant learning).
2. Identify ONLY job-critical gaps — what actually stands between them and doing
   the role, not everything they don't know.
3. Map each gap to a REAL job responsibility (from the target/job posting when
   provided) — so every gap earns its place against the actual work.
4. Turn each gap into a MANAGER-ASSIGNED task — framed as a realistic on-the-job
   assignment that begins with a stakeholder request, with named/given inputs
   (files, datasets, tickets) as a new hire would actually receive.
5. Define a concrete DELIVERABLE and SUCCESS CRITERIA for each task ("done when…").
6. Progress OBSERVE → ASSIST → OWN across the plan (a staged readiness arc), not a
   flat list of lessons. The PHASES are fixed; the TIMING on them is DERIVED from
   the horizon (see below) — never hard-code "30-60-90."
7. End with an INDEPENDENT CONTRIBUTION — the readiness project where they own a
   real piece of the work, reachable only using what the plan covered. It lands at
   the END of the derived horizon.

HORIZON (derive it; never assume a fixed length):
- If the user gave a DEADLINE → the horizon IS that deadline. Compress or stretch
  the observe→assist→own phases to fit (a 3-week runway is a 3-week arc, not 90 days).
- Else if they gave a WEEKLY PACE → derive the horizon from plan effort ÷ pace.
- Else (open / self-paced) → fall back to a sensible default keyed to GOAL, not a
  constant: "curious/landscape" → a short taste (not a long commitment arc);
  "functional/starting a role" → ~30-60-90; "deep/career move" → longer.
- Attach the computed timing to the phase labels; if the horizon is a goal-based
  default (user gave no timeline), STATE it as an assumption the user can change.

Also:
- Title/positioning: use the target role VERBATIM. Never re-categorize it into a
  generic career label. (Header title = target role.)
- Depth/purpose reshape scope: "functional / starting a role" → 3-4 tight steps
  cut to what they touch first, NOT a comprehensive course.
- For each module, name which STAKEHOLDERS consume the output and what each needs
  (adapt the stakeholder set to the target field).
- For each resource: state the gap it closes, why this specific source, and what
  to read/skip. Never a bare reading list.
- Field present → specific; field absent → honest and inviting; never a confident
  guess in between (company, role, sector, dates, responsibilities).
- Keep the grounding rule: recommend only real, canonical resources; the system
  verifies and drops fakes, so fewer certain ones beat plausible-but-uncertain.
```

Positioning note (for you, not the prompt): LabBridge enters as **"career transition + enterprise onboarding,"** not "AI learning-path generator." That reframing is the product's actual wedge — the prompt spine is how it shows up in output.

How this absorbs the earlier fixes: step 1 = P2 (skip-framing); step 3 = P5 (map to responsibilities); step 4 = P3 + P4 (assignments + given data); step 6 = P6 (30-60-90); title rule = P1; resource rule = P7. So you're not doing two sets of edits — this spine *is* the fixes, organized.

---

## Part 2 — Layout re-architecture (information architecture, not visual design)

The current layout front-loads **evaluation** (two long "what you bring / what's missing" lists) and back-loads **action** (the course, compressed to links). That's inverted: the user came for the path, not the audit. Fix the order and emphasis. No colors/fonts here — purely what shows, in what order, and what's collapsed.

### New top-to-bottom order

**1. The hook (new — replaces opening with the full assessment).**
2-3 sentences that state the value immediately: how close they already are, and what the path delivers. Example shape:
> "You're most of the way there — your epidemiology training already covers the hard part of RWE. Here's the ~20% that gets you productive, and the path to close it."
This is the intro AND the interest hook in one. It replaces the two long lists as the opening. (If you name a horizon here, use the DERIVED one — the user's deadline/pace, or a goal-based default stated as an assumption — never a hard-coded "90-day.")

**2. The course — featured, the center of gravity.**
This is the most valuable part and must LOOK like it. Each module shows, at a glance: the assignment (stakeholder-framed), the deliverable, the "done when," the stakeholders who care, and *then* the scoped resource as a supporting detail — not the headline. The course is what the user scrolls into first after the hook, and it should be the visually dominant block (dominant by *space and prominence*, a layout decision — not styling).

**3. "What you already bring / What's actually missing" — COLLAPSED by default.**
Keep the content (it's the core re-interpretation value), but move it below the course and collapse it. It's for the user who wants to verify the reasoning ("why did it pick these gaps?"), not throat-clearing before they see the plan. A one-line summary stays visible ("Built on 5 transferable strengths, targeting 4 job-critical gaps — expand to see the reasoning"); the full lists expand on click.

**4. The readiness project (was "first contribution") — horizon DERIVED, not fixed.**
The independent-contribution capstone, placed at the END of the derived horizon — after the modules, resolving the "depends on unbuilt modules" logic flag. The horizon comes from the user's timeline, in priority order:
- **Deadline given** → capstone lands on that date; phases fit inside it.
- **Weekly pace given** → horizon = plan effort ÷ pace; capstone lands there.
- **Neither** → a goal-based default (e.g. ~90 days for functional/starting-a-role; a short taste for curious/landscape; longer for deep/career-move), and shown as a correctable assumption: *"We set this to a ~90-day arc since you didn't give a timeline — adjust if your runway differs."*

Label the phases by name (observe → assist → own → independent contribution) with the computed timing attached; do NOT print "Day 30/60/90" when the horizon isn't 90 days. Same rule as the header and dates: derived value, shown and overridable, never silently hard-coded.

**5. Plan self-check — collapsed, and failures-only.**
Move off the user's face (currently a wall of "cannot confirm" hedges). Default collapsed; surface only genuine failures, not every over-teaching flag. The full list is for your review pipeline, not the learner's first read.

### The principle

**Lead with value, defer verification.** Assessment and self-check are *verification* surfaces — available, not front-and-center. The course is the *value* surface — featured. Right now the order is backwards; this inverts it. This is a content/structure decision and costs no design time.

---

## Why these two parts are one change

The layout re-architecture only works *because* of the prompt spine. The course section feels thin today because it's mostly links; once Part 1 makes each module a manager-assigned task with a deliverable and success criteria, the course becomes substantive enough to *deserve* being featured. So: **do Part 1 first (it makes the course worth featuring), then Part 2 (which features it).** Don't re-architect around content that hasn't been upgraded yet.

---

## Scope guardrail (important)

- **In scope now:** the prompt spine, and the *order / emphasis / collapse* decisions above. These are content and information architecture — free, and they're what actually makes the plan feel off right now.
- **Out of scope until last:** visual design — color palette, typography, spacing, componentry polish. Don't spend design time or money here until the content and structure are settled. When you do, the structure above is what it dresses.

---

## Build order for Claude Code

1. **Prompt spine (Part 1)** — replace the system-prompt framing; re-run RWE + Blackstone, confirm the course section gets substantive.
2. **Layout re-architecture (Part 2)** — hook-first, course-featured, assessment + self-check collapsed, capstone as Day-90.
3. **Then** the remaining polish items from `labbridge-plan-generator-fixes.md` not already absorbed (P1 header gate if not done, P7 timeline-date gate).
4. **Visual design** — later, separate, on top of the settled structure.
