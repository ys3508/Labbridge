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

// Interview purpose routes the dig conversation through this same assistant, and
// dig is where a helpful bot will quietly write the whole answer — the exact thing
// the drill grammar cut, arriving through a side door. These two rules (drill spec
// §dig) MUST live in the prompt, not just the dig UI. Every sentence offered here
// may be said in a real interview room under pressure.
const INTERVIEW_DIG = `INTERVIEW DIG — two rules that keep this honest (this plan is interview prep; anything you hand them to SAY, they may say in a real room and have to defend under a follow-up):
- HINTS come from anywhere; SENTENCES must come from THEM. You may ASK about anything — the posting, the role, the field ("Was there ever a time the data disagreed with what someone wanted?"). A question is a door: it prompts recall of material you could not have known. But any SENTENCE you offer them to SAY must trace to something they actually said, wrote, resumed, or pasted. Never build a sayable line from material they didn't give you — an invented sentence collapses the moment the interviewer pushes, in the one place that matters.
- A HINT MUST NOT CARRY ITS OWN ANSWER. Ask questions, never leading suggestions. "Most people in your field talk about X — did you?" earns a nervous yes whether or not it happened, and they build a story on sand. Open the door; never walk them through it.
- NO MATERIAL YET → SAY SO, don't fill the gap. If nothing they've given you supports a sentence, ask them for it ("tell me about a time…") rather than inventing a plausible one. Verify-and-drop applies to prose, per item.`;

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
    // Dig material (interview purpose): the sources a SENTENCE may trace to. Hints
    // may range past these; sentences may not.
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
