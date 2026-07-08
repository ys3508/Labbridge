import { client, PLAN_MODEL } from "@/lib/ai";

// Plan checkers (Option B, slice 2). Implements the two AI-supervisor checks
// from labbridge-checker-prompts: gap-accuracy (over-teaching) and first-task
// viability. Both are constrained to COMPARE the inputs given — never to judge
// from outside knowledge — so a finding is always a specific, checkable claim.
// (The code-based grounding + prerequisite-integrity checks need the skill
// graph; those arrive with slice 4.)

const OVERTEACH_SYSTEM = `You are a VERIFICATION CHECKER for an onboarding-plan generator. You are NOT a plan writer and NOT a tutor. Your only job is to COMPARE two inputs and report specific mismatches.

ABSOLUTE RULES
- Use ONLY the two inputs below. Do NOT use outside knowledge to decide whether the plan is "good" or whether a topic is "important."
- Your job is comparison, not opinion. Do NOT return a score or a rating.
- Report SPECIFIC items — name the exact node/topic.
- If deciding an item would require any knowledge beyond the inputs, or the evidence is only suggestive, do NOT guess: put it in needs_review.

CHECK — over-teaching only: for each topic in INPUT B (the plan), does INPUT A (the learner's background) already CLEARLY demonstrate competence in it? "Clearly" means explicit evidence in INPUT A (they already do this), not a guess that "someone like this probably knows it." If evidence is only suggestive or you are unsure, put it in needs_review, NOT already_known.`;

const OVERTEACH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    already_known: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { node: { type: "string" }, evidence: { type: "string" } },
        required: ["node", "evidence"],
      },
    },
    needs_review: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { node: { type: "string" }, reason: { type: "string" } },
        required: ["node", "reason"],
      },
    },
    pass: { type: "boolean" },
  },
  required: ["already_known", "needs_review", "pass"],
};

const FIRSTTASK_SYSTEM = `You are a VERIFICATION CHECKER. Compare the proposed FIRST TASK against what the plan actually teaches. Do NOT judge whether the task is "good" — only whether it is REACHABLE and CONCRETE given the plan.

ABSOLUTE RULES
- Use ONLY the inputs. For the prerequisite check, compare strictly against the covered-skills list (INPUT B); do NOT assume the learner knows anything not listed there.
- Report SPECIFIC items. If unsure, use needs_review — do not guess.
- Do NOT return a score.

CHECKS
1. PREREQUISITE COVERAGE — Does the task require any skill NOT present in INPUT B? List each missing skill and the part of the task that needs it.
2. CONCRETENESS — Could the learner physically begin this (a defined input, a defined output/deliverable)? If vague or abstract, name what is undefined.
3. SCOPE — Given INPUT C (the time budget), is the task plausibly finishable in that window? Flag only if it clearly is not; otherwise use needs_review if you can't tell. Put a single short concern in scope_concern, or "" if none.`;

const FIRSTTASK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    missing_prerequisites: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { skill: { type: "string" }, task_part: { type: "string" } },
        required: ["skill", "task_part"],
      },
    },
    vague_points: { type: "array", items: { type: "string" } },
    scope_concern: { type: "string" },
    needs_review: { type: "array", items: { type: "string" } },
    pass: { type: "boolean" },
  },
  required: ["missing_prerequisites", "vague_points", "scope_concern", "needs_review", "pass"],
};

async function runCheck(system, schema, userText) {
  const message = await client.messages.create({
    model: PLAN_MODEL,
    max_tokens: 1024,
    system,
    output_config: { format: { type: "json_schema", schema } },
    messages: [{ role: "user", content: userText }],
  });
  const block = message.content.find((b) => b.type === "text");
  return block ? JSON.parse(block.text) : null;
}

function backgroundText(bg) {
  const parts = [];
  if (bg?.field?.length) parts.push(`Field(s): ${bg.field.join(", ")}`);
  if (bg?.skills?.length) parts.push(`Stated skills: ${bg.skills.join(", ")}`);
  if (bg?.resume?.trim()) parts.push(`Resume/bio: ${bg.resume.slice(0, 6000)}`);
  return parts.join("\n") || "(no background provided — treat as a beginner with no prior competence)";
}

function timeWindow(tl) {
  // The earliest readiness phase is ~the first 30 days on the job.
  if (tl?.mode === "deadline") return tl.deadline ? `the first ~30 days, toward a deadline of ${tl.deadline}` : "the first ~30 days";
  if (tl?.mode === "pace") return `the first ~30 days, at ~${tl.weeklyHrs || "a few"} hours/week`;
  return "the first ~30 days (self-paced)";
}

export async function POST(request) {
  let plan, background, timeline;
  try {
    const body = await request.json();
    plan = body?.plan;
    background = body?.background || {};
    timeline = body?.timeline || {};
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!plan?.learningSequence) return Response.json({ error: "No plan provided." }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: "No API key configured." }, { status: 500 });

  const planNodes = plan.learningSequence.map((s, i) => `${i + 1}. ${s.topic} — ${s.why}`).join("\n");
  const coveredSkills = [
    ...(background.skills || []),
    ...plan.learningSequence.map((s) => s.topic),
  ].join(", ");
  const phases = plan.firstTask?.phases || [];
  const firstPhase = phases[0];
  const phaseText = phases.map((p) => `${p.stage} (${p.timing}): ${p.goal}`).join("\n- ");
  // The readiness project is a staged observe→assist→own arc; the NEAR-TERM check
  // is the earliest phase (what they must reach first), not the "Own" culmination.
  const firstTaskText = `Title: ${plan.firstTask?.title || ""}\nWhy: ${plan.firstTask?.why || ""}\nStaged phases:\n- ${phaseText}\n\nThe check below concerns only the EARLIEST phase${firstPhase ? ` ("${firstPhase.stage} (${firstPhase.timing}): ${firstPhase.goal}")` : ""} — later phases are expected to build on the modules and each other.`;

  const overteachPrompt = `INPUT A — Learner background (their own words + skills):\n${backgroundText(background)}\n\nINPUT B — Proposed plan (ordered topics the plan will TEACH):\n${planNodes}\n\nReport over-teaching only, per your rules.`;
  const earliestWindow = firstPhase?.timing ? `the earliest phase's window ("${firstPhase.timing}")` : timeWindow(timeline);
  const firstTaskPrompt = `INPUT A — First task, exactly as written to the learner:\n${firstTaskText}\n\nINPUT B — Skills available before the task (what they already had + what the plan covers):\n${coveredSkills}\n\nINPUT C — Time budget: ${earliestWindow}\n\nRun the three checks per your rules.`;

  try {
    const [overteaching, firstTask] = await Promise.all([
      runCheck(OVERTEACH_SYSTEM, OVERTEACH_SCHEMA, overteachPrompt),
      runCheck(FIRSTTASK_SYSTEM, FIRSTTASK_SCHEMA, firstTaskPrompt),
    ]);
    return Response.json({ overteaching, firstTask });
  } catch (err) {
    if (err?.status === 401) return Response.json({ error: "Invalid API key." }, { status: 401 });
    console.error("check route error:", err?.message || err);
    return Response.json({ error: "Plan check failed." }, { status: 500 });
  }
}
