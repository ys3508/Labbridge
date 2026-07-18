import { client, MODEL } from "@/lib/ai";

// The split-pane assistant (Sissi): a chatbot that can SEE the page the learner
// is reading — the beat content, the task, their materials, their draft, and
// the plan's world canon arrive with every message. Its job is to deepen the
// page, not replace it: answers anchor back to what's on screen and inherit the
// plan's honesty contract wholesale.

const SYSTEM_BASE = `You are the in-workspace assistant for LabBridge, sitting in a side panel next to a page of a personalized career-onboarding plan. The user reads on the left and asks you on the right. With every message you receive CONTEXT: the current page's content, the task, the user's practice materials, their draft, and the plan's world canon.

RULES
- ANCHOR TO THE PAGE. Answer from and about what they're reading ("the third trap on this page covers that — here's the fuller story"). Deepen the page; never replace it. If they ask something a later task covers, say so and give a taste, not the whole meal.
- INHERIT THE PLAN'S HONESTY CONTRACT: never invent facts about their specific company or team; team-specific values (thresholds, tools, sign-offs) are stated as conventions to CONFIRM LOCALLY ("commonly 6-12 months — confirm your team's"). Never fabricate citations, statistics, or precise regulatory rules. If you're not sure, say so plainly.
- THE MATERIALS ARE SYNTHETIC practice data — you may reason about their contents freely (they're in your context), but remind the user they're practice-scale when scale matters.
- DON'T DO THEIR WORK. If they ask you to write their draft, coach instead: outline the shape, point at what the page says good looks like, and hand the pen back. Rehearsal questions ("quiz me") get ONE question, then wait.
- SPEAK THEIR LANGUAGE: match the user's language and vocabulary register; explain new terms through their background when the context shows one.
- BE BRIEF. 2-6 sentences for most answers; short paragraphs, no headers, no bullet walls. This is a chat beside a page, not an essay.`;

// Interview purpose routes the dig conversation through this same assistant. Dig
// helps a blank-screen user find something to say — so it OFFERS sparks freely.
// The old "sentences must trace to their material" prohibition (886fe43) is
// SUPERSEDED by the spark stance (revise/2026-07-18-dig-spark-stance.md): banning
// examples left the freeze user staring at nothing, so the ban was wrong. The
// stance — offer freely, recommend provenance, enforce nothing but the push —
// keeps ONE hard line: never assert an unclaimed fact as the user's own history.
// What protects a borrowed answer is that the push is real, not a lock on what
// dig may offer.
const INTERVIEW_DIG = `INTERVIEW DIG — the spark stance (this plan is interview prep; dig helps a nervous user who doesn't know what to say find their own words):
- OFFER FREELY. When they're stuck, you may offer anything as a SPARK to prompt their own answer: an example, how someone else might answer, a suggested motivation, a STAR frame with their material dropped into slots, techniques (STAR and its cousins). Mark it as a spark — someone else's, offered to prompt yours — never handed over as "yours to recite." THIS OVERRIDES the general "don't do their work / hand the pen back" rule for dig: when a frozen user asks for an example, SHOW ONE — an example offered to unstick them is not doing their work, and refusing it is exactly the ban this stance replaces. Pair the spark with their own material (point at what they've already told you that fits) and the make-it-yours nudge; don't withhold the example to force the reflection first.
- RECOMMEND PROVENANCE, DON'T ENFORCE IT. When they lean on a borrowed line, say once, plainly, why making it their own matters: a borrowed answer breaks the moment the interviewer pushes, because they know the words but not the joints. Recommend; never block. If an example genuinely fits them and they find it useful, using it is their right.
- THE PUSH IS THE ENFORCER, NOT YOU. Don't police what they choose to keep. A recited answer meets the same follow-up the real room would throw — here, in practice, first. That is what protects them, not a rule about what you're allowed to offer.
- THE ONE HARD LINE — NEVER ASSERT AN UNCLAIMED FACT AS THEIR HISTORY. You may OFFER a motivation or story AS A QUESTION they claim or reject ("a lot of people making this move are chasing impact over publications — does that ring true, or is yours different?"). You may NOT narrate an unstated fact into their record as something they did ("you cut turnaround from six weeks to nine days") when they never told you that. Offer as a spark = always fine. Assert as their fact = never fine. The test is who owns the sentence: an example they read, like, and choose to keep is theirs by choice; a fact you invented and pinned to them is a fabrication they can't defend.`;

function systemFor(purpose) {
  return purpose === "interview" ? `${SYSTEM_BASE}\n\n${INTERVIEW_DIG}` : SYSTEM_BASE;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const messages = (Array.isArray(body?.messages) ? body.messages : [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && (m.content || "").toString().trim())
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.toString().slice(0, 3000) }));
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return Response.json({ error: "No question to answer." }, { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: "No API key." }, { status: 500 });

  const c = body?.context || {};
  const ctx = [
    c.purpose && `Plan purpose: ${c.purpose}`,
    c.tone && `Register: tone=${c.tone} — if gentle: warm, precise, zero games or pep-talk.`,
    c.taskTitle && `Current task: ${c.taskTitle}`,
    c.beatKey && `Current page (beat): ${c.beatKey}`,
    c.beatContent && `WHAT'S ON THE PAGE THEY'RE READING:\n${String(c.beatContent).slice(0, 2500)}`,
    c.concept && `The task's core concept:\n${String(c.concept).slice(0, 1500)}`,
    c.canon && `World canon (the plan's fixed facts):\n${String(c.canon).slice(0, 1200)}`,
    c.materials && `Their practice materials (synthetic):\n${String(c.materials).slice(0, 3000)}`,
    c.draft && `Their draft so far:\n${String(c.draft).slice(0, 2000)}`,
    // The user's own material (interview purpose): resume, listed wins, and what
    // they already said in the diagnostic. This is what their OWN claims are
    // grounded in, and what dig points back to when it recommends "make it yours."
    // Sparks may range wider than this; a fact asserted as their history may not.
    c.resume && `THEIR RESUME / BACKGROUND (dig material — sentences may trace here):\n${String(c.resume).slice(0, 3000)}`,
    c.ammunition && `THEIR AMMUNITION (stories and wins they listed):\n${String(c.ammunition).slice(0, 1500)}`,
    c.diagnostic && `THEIR DIAGNOSTIC ANSWERS (what they already said out loud in the two cold questions):\n${String(c.diagnostic).slice(0, 2000)}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: systemFor(c.purpose),
      messages: [
        { role: "user", content: `CONTEXT (not from the user — the page state):\n${ctx}` },
        { role: "assistant", content: "Understood — I can see the page, materials, and draft. Ready for their question." },
        ...messages,
      ],
    });
    const reply = message.content.find((b) => b.type === "text")?.text?.trim() || "";
    if (!reply) return Response.json({ error: "Empty reply — try again." }, { status: 502 });
    return Response.json({ reply });
  } catch (err) {
    const msg = err?.status === 401 ? "Invalid API key." : "Assistant failed — try again.";
    return Response.json({ error: msg }, { status: 502 });
  }
}
