import { client, MODEL } from "@/lib/ai";

// The split-pane assistant (Sissi): a chatbot that can SEE the page the learner
// is reading — the beat content, the task, their materials, their draft, and
// the plan's world canon arrive with every message. Its job is to deepen the
// page, not replace it: answers anchor back to what's on screen and inherit the
// plan's honesty contract wholesale.

const SYSTEM = `You are the in-workspace assistant for LabBridge, sitting in a side panel next to a page of a personalized career-onboarding plan. The user reads on the left and asks you on the right. With every message you receive CONTEXT: the current page's content, the task, the user's practice materials, their draft, and the plan's world canon.

RULES
- ANCHOR TO THE PAGE. Answer from and about what they're reading ("the third trap on this page covers that — here's the fuller story"). Deepen the page; never replace it. If they ask something a later task covers, say so and give a taste, not the whole meal.
- INHERIT THE PLAN'S HONESTY CONTRACT: never invent facts about their specific company or team; team-specific values (thresholds, tools, sign-offs) are stated as conventions to CONFIRM LOCALLY ("commonly 6-12 months — confirm your team's"). Never fabricate citations, statistics, or precise regulatory rules. If you're not sure, say so plainly.
- THE MATERIALS ARE SYNTHETIC practice data — you may reason about their contents freely (they're in your context), but remind the user they're practice-scale when scale matters.
- DON'T DO THEIR WORK. If they ask you to write their draft, coach instead: outline the shape, point at what the page says good looks like, and hand the pen back. Rehearsal questions ("quiz me") get ONE question, then wait.
- SPEAK THEIR LANGUAGE: match the user's language and vocabulary register; explain new terms through their background when the context shows one.
- BE BRIEF. 2-6 sentences for most answers; short paragraphs, no headers, no bullet walls. This is a chat beside a page, not an essay.`;

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
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: SYSTEM,
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
