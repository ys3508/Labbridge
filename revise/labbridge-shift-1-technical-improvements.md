# LabBridge Shift 1 — Technical Improvement Ideas

## Goal

Shift 1 should turn each generated module from a pointer into a container.

Current module shape:

```text
topic -> why -> task -> resource
```

Target module shape:

```text
capability -> why now -> taught concept -> worked example -> assignment -> self-check -> supporting resource
```

The technical goal is not simply "more words." It is to make the generator produce a structured learning object that can be rendered, checked, and improved over time.

---

## 1. Upgrade the Plan Schema

### Current Problem

`learningSequence` mostly emits a topic, a why paragraph, and a task. This makes the UI depend on the task and resource to carry the whole experience.

The result feels thin because the plan does not teach the missing concept before asking the user to work.

### Proposed Module Schema

```js
{
  title: "Understand how claims records turn care into evidence",
  capability: "Explain the grain, keys, and limits of claims/EHR/registry tables",
  whyNow: "Why this is the next prerequisite, tied to the learner's background",
  bridgeFromBackground: "How this connects to what the learner already knows",
  concept: {
    explanation: "120-220 words teaching the core idea directly",
    misconceptionToAvoid: "One common wrong mental model",
    keyTerms: [
      { term: "enrollment span", plainMeaning: "the period where you can observe the patient" }
    ]
  },
  workedExample: {
    setup: "A tiny realistic scenario",
    walkThrough: ["step 1", "step 2", "step 3"],
    takeaway: "The principle the example illustrates"
  },
  task: {
    title: "Data-model orientation memo for a new claims extract",
    managerRequest: "Your RWE lead says: ...",
    givenInputs: ["claims_sample.csv", "data dictionary draft"],
    steps: ["...", "..."],
    deliverable: "...",
    doneWhen: "...",
    stakeholders: "..."
  },
  selfCheck: {
    criteria: ["...", "...", "..."],
    redFlags: ["...", "..."]
  },
  resourceNote: "Use the supporting resources only to deepen or verify the concept."
}
```

### Why This Helps

This gives the renderer and future checkers stable handles:

- `concept.explanation` can be checked for substance.
- `workedExample` can be checked for concreteness.
- `givenInputs` can be checked to prevent "go find your own dataset."
- `selfCheck.criteria` can become lightweight learner reflection later.

---

## 2. Add Generation Invariants

The prompt should include hard invariants for every module.

### Suggested Invariants

1. The module title must be a capability, not a school topic.
   - Weak: "Medical coding systems"
   - Strong: "Use ICD, CPT, and NDC codes to make a clinical concept computable"

2. The concept explanation must teach before assigning.
   - It should be understandable without opening a resource.
   - Target length: 120-220 words.

3. The worked example must use a tiny concrete object.
   - Example: one patient, three claims rows, one diagnosis code, one pharmacy fill.
   - Avoid abstract examples like "consider a dataset."

4. The task must begin with a stakeholder request.
   - "Your RWE lead says..."
   - "Medical affairs asks..."
   - "A data engineering partner gives you..."

5. The task must provide given inputs.
   - Acceptable: "You are given `claims_sample.csv` and a draft data dictionary."
   - Not acceptable: "Find a dataset" or "simulate claims data."

6. Self-check must be practical, not motivational.
   - Strong: "Another analyst can reproduce your cohort counts from the spec."
   - Weak: "You feel confident explaining the topic."

7. Resources are supporting material, not the main learning path.
   - The user should know what to do before reading.

---

## 3. Improve Prompt Wording

Add a dedicated block to the plan generation system prompt:

```text
MODULES MUST CONTAIN LEARNING, NOT POINT TO LEARNING.

For each module, first teach the missing concept directly in the learner's terms.
The learner should not need to leave the page to understand the core idea.

Each module must include:
1. a capability-oriented title
2. why this comes now in the prerequisite order
3. a concise taught concept
4. one worked example with a tiny concrete object
5. a manager-assigned task using given inputs
6. a self-check with practical criteria and red flags
7. supporting resources only after the embedded content

Do not write a generic textbook explanation. Bridge from the learner's background.
Do not make factual claims that depend on specific sources unless they are present in the input or are framed as general workflow orientation.
```

Also change the schema labels from school language to work language:

- `topic` -> `title` or `capability`
- `why` -> `whyNow`
- `task.title` remains, but add `managerRequest`
- add `concept`
- add `workedExample`
- add `selfCheck`

---

## 4. Add a Module Quality Checker

This can be a cheap non-AI checker first.

### Static Checks

For each module:

- `concept.explanation.length >= 500` characters
- `workedExample.setup.length >= 120` characters
- `task.givenInputs.length >= 1`
- `task.managerRequest` contains a stakeholder-like phrase
- `selfCheck.criteria.length >= 3`
- `task.steps.length >= 3`
- no banned phrases:
  - "find a dataset"
  - "search online"
  - "read about"
  - "learn about"
  - "simulate your own"

### AI Checker Later

After the static checker works, add an AI checker that answers:

- Does the concept actually teach the prerequisite?
- Is the worked example concrete enough?
- Does the task rely on skills not yet taught?
- Does the module bridge from the user's background?
- Is the module too generic for the target role?

The checker should return specific findings, not a score.

---

## 5. Fix Deadline Fidelity

The pasted test output showed a likely date issue:

```text
by your 2026-08-27 deadline
```

If the user entered `2026-08-07`, this is a trust-breaking bug.

### Technical Rule

If `timeline.mode === "deadline"` and `timeline.deadline` exists:

- pass the exact deadline string into the prompt
- render the exact deadline string in the readiness project
- never let the model invent or transform the deadline

### Safer Architecture

Do not ask the model to decide the final displayed deadline.

Instead:

```js
const deadlineDisplay = payload.timeline.deadline;
```

Let the model generate phase labels, but the UI should own the factual deadline display.

---

## 6. Separate Facts From Fluency

Shift 1 adds more generated text, which increases the risk of plausible filler.

Use a two-layer rule:

### Safe for the Model to Generate

- analogies from the user's background
- workflow framing
- prerequisite order
- manager-task wording
- self-check criteria
- "what to notice" in a tiny example

### Should Be Grounded or Avoided

- named resources
- regulatory claims
- exact clinical definitions
- coding rules
- claims about company-specific workflow
- citations

For RWE, the module can safely teach:

```text
Claims data records billable events, not a full clinical narrative.
```

But should avoid unsupported specifics like:

```text
Two E11 codes exactly 30 days apart are the standard definition for diabetes.
```

Unless that rule came from the input or a verified source.

---

## 7. Improve Resource Selection UX

The current resources are verified but sometimes feel too academic or intimidating.

### Suggested Resource Fields

```js
resource: {
  title,
  source,
  url,
  kind,
  whyThisResource,
  useOnlyThisPart,
  skipThisPart,
  difficulty: "reference" | "intro" | "advanced",
  confidence: "strong" | "okay" | "fallback"
}
```

### Rendering Change

Change heading from:

```text
For this task
```

to:

```text
Supporting reference
```

or:

```text
Use if you want backup
```

This makes the embedded module feel like the product, and the resource feel like backup.

---

## 8. Make Module 1 the Golden Test

Before rolling across all modules, manually judge one module.

Golden module:

```text
Understand how claims records turn care into analyzable evidence
```

### Expected Content

The module should explain:

- claims are billable event trails, not full clinical stories
- one patient appears across many rows and tables
- enrollment defines when a patient is observable
- diagnoses, procedures, and pharmacy fills are clues, not perfect truth
- cohort logic is built by linking rows across time

### Expected Worked Example

Use one fake patient:

```text
Patient 104 has:
- continuous enrollment from Jan-Dec
- two E11 diagnosis claims
- one metformin fill
- one endocrinology visit
```

Walk through what this can and cannot prove:

- can support possible Type 2 diabetes
- can support treated diabetes if medication mapping is correct
- cannot prove lab control without lab values
- cannot observe care outside enrollment

### Expected Task

The task should ask for a data orientation memo, not analysis yet.

This is important: module 1 should teach restraint. The learner's first job is to understand the data shape before building cohorts.

---

## 9. Add Regression Fixtures

Create a small folder such as:

```text
fixtures/golden-rwe-input.json
fixtures/golden-growth-equity-input.json
fixtures/golden-beginner-input.json
```

Use them to repeatedly test:

- header fidelity
- company/role fidelity
- deadline fidelity
- module richness
- no fake resources
- no "go find your own dataset"
- no recategorizing roles

For now, even manual fixtures are valuable. Later they can become automated route tests.

---

## 10. Suggested Today Plan

### If You Have 2-3 Hours

1. Fix deadline fidelity.
2. Add `concept`, `workedExample`, and `selfCheck` to the plan schema.
3. Render those fields in `PlanView`.
4. Run the RWE golden test.
5. Judge module 1 only.

### If You Have 6-8 Hours

Do the above, then:

1. Add static module quality checks.
2. Add a fixture for the RWE golden test.
3. Tune prompt until module 1 feels genuinely useful.
4. Only then judge modules 2-5.

### If You Have 20-30 Hours

After Shift 1 works:

1. Build three golden fixtures across domains.
2. Add automated checks for schema and banned phrases.
3. Add an AI checker for module substance.
4. Improve resource ranking and resource UX.
5. Then begin Shift 2 tracking.

---

## Core Product Standard

A good LabBridge module should feel like a senior teammate saying:

```text
Here is the concept you need.
Here is the mental model from your background.
Here is what it looks like in a tiny example.
Here is the first real assignment.
Here is how you know your work is good enough.
```

If a module cannot do that, it is still a pointer, not a container.

