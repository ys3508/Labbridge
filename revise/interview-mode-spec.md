# Interview Mode — the front door (full spec from the Jul 15 brainstorm)

**Strategic decision (Sissi):** interview prep becomes the product's highlight/entry point — the acquisition wedge that earns trust fast (verified by the real room within days), converting into onboarding at the win moment. Onboarding stays the retention core. Positioning: the career-changer's interview — the corner of the market nobody serves.

**Calibrated promise (never inflate):** "Nothing in this posting will surprise you." / "Walk in with answers rehearsed against pushback, anchored to your real background." Never "ace any interview."

## The input door (Sissi, Jul 15 — the input side of "purpose picks the grammar")

The form adapts per door. Interview mode's fields, in order:
1. **Job description** (promoted to THE field — the Question Map's receipts depend on it)
2. **Company** (first-class, no longer only via the posting) — powers "why this company" + questions-to-ask-them; honesty rule: the name frames prep, never invents facts about them
3. Role · Resume/background (urged: "add it and every answer gets built from your life")
4. **The interview:** "What round is it, what format — and what are you most worried they'll ask?" (round → unit selection; worry → cram order + boss-fight framing)
5. **The challenge field:** "What's the hardest part of this for you? The question you're dreading, nerves, explaining a gap or layoff, interviewing in your second language — whatever it actually is." One warm field, two signal types: content fears → cram order/boss fight; PERSONAL obstacles → delivery-axis weighting, dedicated units (e.g. "explaining the gap" — invisible in any posting), tone calibration, language rules. The worry field tunes the CONTENT; the challenge field tunes the TREATMENT.
   - CARE RULE: this field invites vulnerable disclosures (visa, age, disability). Engage honestly with what we can help (framing, practice, narrative); say plainly what we can't (no legal/visa advice); never dismiss, never overpromise.
6. **"When is the interview?"** (+ optional hours/day) — drives countdown, cram order, budget, walk-in-card timing.

## The journey

1. **Entry (lighter than the form):** paste the job posting + the interview date (resume optional but urged — "add it and every answer gets built from your life"). Date drives everything: countdown identity, cram ordering, cheat-sheet timing.
2. **The first 30 seconds — diagnostic, not lesson (Sissi's principle: the tool's first act is listening).**
   - Contract sentence above Q1 — she loves all three; blend or A/B:
     1. "Before I teach you anything, I want to hear you. Two questions, cold — the way the room asks them. Then we'll both know exactly where we're starting."
     2. "Everyone else starts with lessons. I start by listening — answer like it's real, and I'll be honest about where you stand."
     3. "Two questions before anything else. The first you already know the answer to; the second you might not — and that's exactly what I need to hear."
   - **Q1 (can't be ambushed):** "Walk me through your background — and why this role." Graded on delivery patterns AND substance against ground truth we hold (their resume): "you never mentioned the vaccination project — your strongest evidence, left on the table." First feedback proves the tool listened.
   - **Q2 (permission to miss, framed in advance):** the posting's most likely technical question — "you might not be able to answer it yet; that's the point — whatever's missing is what the plan is for." Failure redefined as map-making, out loud, before it happens.
   - Diagnostic answers stored as the BASELINE ARTIFACTS for arc tracking. ~2 coach calls (~2¢), verdicts feed the generation prompt: **the map generates visibly FROM the diagnostic** ("your story buries the result — that's drill 1; you couldn't finish the look-back question — stops 2-3 exist because of that").
3. **The Question Map** (the roadmap, interview identity): all likely questions grouped — concept drills · behavioral · your story · THE GAP QUESTION · questions-you-ask-them. **Receipts on every question**: a chip citing the posting line it derives from (verify-and-drop ethos applied to questions). Coverage meter replaces files counter ("7 of 12 answers banked").
   - **The gap question: NAMED, NOT DREADED (decided).** Distinct marker from minute one, safety in the same breath: "Yes, they'll ask it. It's stop 6 — and by then the answer will be built, from strengths you already have." Tap for a preview of why it's answerable.
4. **Units (drill grammar, already shipped) + additions:**
   - `decode` line per question — "the question behind the question" ("they're not asking about the failure; they're testing whether you own it without spiraling"). The mentor-tells-you-the-secret move; interview cousin of field-tested traps.
   - **Graduated exposure ramp per answer:** write it (editable) → say it once (timer, no speech-rec gimmicks) → survive the mid-answer push. Badge: "survived 2 pushes."
   - STAR-from-resume: behavioral answers pre-drafted from their real projects; they edit, not compose.
   - Questions-you-ask-them: reuse the askYourTeam generator ("what's your minimum reportable cell size?" energy).
5. **Two-axis scoring everywhere: SUBSTANCE and DELIVERY, never blended.** ("Your content is strong; your delivery buries it.") Per-kind rubrics — drafted, approved in principle, **DEFERRED by Sissi ("deal with it later")** — table sketch lives in the Jul 15 conversation; write into prompt+coach when built. Rubric shown BEFORE answering (criteria-before-Try pattern).
6. **The mock-interview runner (flagship interactive):** Warm-up (2) → Core (4-5, each followed by ONE **dynamic pushback** generated from what they actually said — the signature feature; /api/assist multi-turn) → Rapid fire (6 × 30s). Coach-scored. **Fail-safely beat:** when an answer falls short, show "the save you didn't reach for" — built ONLY from their own answer's material, never a fantasy model answer. End: report card (strongest answer · the push you folded on · tomorrow's drill), saved as artifact. Cost ~15-30¢/mock, stated honestly on the button.
7. **Arc tracking:** quote the baseline back ("day one: 40 seconds of setup before the result; today you led with it"). Praise only when earned; name the un-moved dimension gently ("structure's clicking; you're still underselling your own role").
8. **The close — the WALK-IN CARD:** calibrated confidence as a pocket artifact, the last screen before the room: "Ready: technical rounds — genuinely. Fixable and improving: behavioral (moved once this week already). Watch for: underselling your role." The cheat-sheet export's emotional twin.
9. **Post-interview loop (trust flywheel):** log what they actually asked (predicted-vs-asked = our accuracy telemetry) → weak spots regenerate as drills → outcome capture: "Got it!" → the onboarding handoff ("Now let's make week one as prepared as the interview was" — plan generates smarter from interview data); "next round" → re-cram; "not this one" → the bank rolls forward to the next company. A campaign companion, not a single-interview tool.

## What we deliberately DON'T do
No coding-interview lane. No "we predict their exact questions." No speech-analysis scores in v1. No pep talks — calibrated reads only.

## Build sequence
1. Sissi's interview-purpose generation (~$0.40) — the raw material and the before/after benchmark.
2. Homepage two doors ("Interviewing for it?" / "Starting it soon?") + posting-first entry + date.
3. Diagnostic-first flow (contract line, Q1/Q2, map-generates-from-it).
4. Question Map render (receipts, coverage meter, named-not-dreaded gap stop).
5. Mock runner v1 (dynamic pushback + report card) — now ahead of DuckDB.
6. Walk-in card + cheat-sheet export.
7. Post-interview loop + the win handoff.
8. (Deferred with the rest: rubric authoring — item 5's prerequisite is partial rubrics in the coach prompt; full per-kind rubric pass when Sissi says.)
