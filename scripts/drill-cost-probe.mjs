import fs from "node:fs";

function loadDotEnvLocal() {
  try {
    const raw = fs.readFileSync(".env.local", "utf8");
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const i = trimmed.indexOf("=");
      if (i === -1) return;
      const key = trimmed.slice(0, i).trim();
      let value = trimmed.slice(i + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (key && process.env[key] == null) process.env[key] = value;
    });
  } catch {}
}

function routeConst(source, name) {
  const re = new RegExp(`const\\s+${name}\\s*=\\s*\`([\\s\\S]*?)\`;`);
  const match = source.match(re);
  if (!match) throw new Error(`Could not find ${name}`);
  return match[1];
}

function cents({ inputTokens, outputTokens }) {
  return inputTokens * 0.0001 + outputTokens * 0.0005;
}

function words(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function makeTake(base, targetWords) {
  const filler =
    " I would anchor the answer in the posting, separate what I already know from what I would confirm, and keep coming back to the deal question rather than pretending certainty.";
  let out = base.trim();
  while (words(out) < targetWords) out += filler;
  return out.split(/\s+/).slice(0, targetWords).join(" ");
}

loadDotEnvLocal();
const { client, MODEL } = await import("../lib/ai.js");

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY not found in environment or .env.local");
}

const coachRoute = fs.readFileSync("app/api/coach/route.js", "utf8");
const assistRoute = fs.readFileSync("app/api/assist/route.js", "utf8");
const COACH_SYSTEM = routeConst(coachRoute, "SYSTEM");
const ASSIST_SYSTEM = `${routeConst(assistRoute, "SYSTEM_BASE")}\n\n${routeConst(assistRoute, "INTERVIEW_DIG")}`;

const S = { type: "string" };
const PUSH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    interrupt: S,
    whyThisPush: S,
  },
  required: ["interrupt", "whyThisPush"],
};

const REVIEW_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    overall: S,
    criteria: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          status: { type: "string", enum: ["met", "thin", "missing"] },
          note: S,
        },
        required: ["status", "note"],
      },
    },
    redFlagHits: { type: "array", items: S },
    nextEdits: { type: "array", items: S },
  },
  required: ["overall", "criteria", "redFlagHits", "nextEdits"],
};

const NOTE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    bullet: S,
  },
  required: ["bullet"],
};

const fixture = {
  jd:
    "Investment Banking Associate, lower-middle-market M&A. Responsibilities include owning quality-of-earnings diligence workstreams, building and auditing three-statement operating models, preparing investment committee materials, evaluating working-capital peg assumptions, and explaining downside scenarios to senior bankers and sponsor clients.",
  question:
    "Walk me through how you'd approach a quality-of-earnings analysis for a potential acquisition. What would you look at first, and why?",
  resume:
    "Ryan Wang is an investment banking analyst with two years of middle-market M&A experience. He built three-statement operating models at unit level for a 115-unit franchisee, prepared investment committee materials, summarized market and buyer landscapes, and supported diligence workstreams for sell-side processes.",
  diagnostic:
    "Q1: I talked through my franchisee modeling work but buried the result until the end. Q2: I said I would start by checking revenue quality, margins, working-capital trends, and one-time adjustments, but I was thin on how QoE changes the purchase price conversation.",
  beatContent:
    "Decode: They are not asking you to recite an accounting checklist. They are testing whether you can turn a messy diligence request into a defensible first pass: what quality means, what evidence you would inspect, what you would not overclaim, and how you would communicate uncertainty under pressure.",
};

const baseTake =
  "I would start by clarifying what earnings number the buyer is relying on, then test whether it is repeatable. I would look for one-time revenue, margin changes, customer concentration, working capital timing, and add-backs that make EBITDA look cleaner than it really is.";

const lengths = [
  { label: "short", takeWords: 55, pushWords: 25 },
  { label: "typical", takeWords: 135, pushWords: 55 },
  { label: "long", takeWords: 260, pushWords: 95 },
];

async function callClaude({ label, system, messages, maxTokens, schema }) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    ...(schema ? { output_config: { format: { type: "json_schema", schema } } } : {}),
    messages,
  });
  const text = response.content.find((b) => b.type === "text")?.text || "";
  return {
    label,
    model: MODEL,
    inputTokens: response.usage?.input_tokens || 0,
    outputTokens: response.usage?.output_tokens || 0,
    costCents: cents({
      inputTokens: response.usage?.input_tokens || 0,
      outputTokens: response.usage?.output_tokens || 0,
    }),
    text,
  };
}

function pushPrompt(take) {
  return [
    "Generate the one mid-answer interviewer interrupt for this drill.",
    "Use the candidate's transcript so far. Pressure-test the claim they just made; do not introduce new company facts.",
    "Return one concise interrupt a real interviewer could put on screen.",
    `JD:\n${fixture.jd}`,
    `Interview question:\n${fixture.question}`,
    `Resume/context:\n${fixture.resume}`,
    `Diagnostic answers:\n${fixture.diagnostic}`,
    `Transcript so far:\n${take}`,
  ].join("\n\n");
}

function reviewPrompt({ take1, take2, pushAnswer }) {
  const criteria = [
    "Answers the QoE question directly before listing diligence steps.",
    "Names the evidence they would inspect and why it changes confidence in EBITDA.",
    "Survives the push by explaining how they would prioritize under time pressure.",
    "Delivery is structured, answer-first, and does not hide uncertainty behind jargon.",
  ];
  const redFlags = [
    "Treats model-building experience as proof they can run QoE without naming the diligence work.",
    "Lists accounting terms without connecting them to purchase-price risk.",
    "Overclaims certainty from a first pass.",
  ];
  return [
    "Task: Interview drill — quality of earnings answer",
    "Deliverable: spoken answer-bank take with push response",
    "Done when: the answer lands in the room and survives one realistic follow-up",
    `Task context: ${fixture.beatContent}`,
    `Steps the draft should reflect:\n1. Answer the interviewer question.\n2. Handle the push.\n3. Name limits honestly.`,
    `Success criteria (return one status per criterion, in this order):\n${criteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}`,
    `Red flags to check for:\n${redFlags.map((r) => `- ${r}`).join("\n")}`,
    `THE DRAFT:\n"""\nQuestion: ${fixture.question}\n\nTake 1 transcript:\n${take1}\n\nInterviewer push:\nHow would you decide what to prioritize if you only had two hours before the sponsor call?\n\nPush response:\n${pushAnswer}\n\nTake 2 transcript:\n${take2}\n"""`,
  ].join("\n\n");
}

function notePrompt({ selectedMoment }) {
  const ctx = [
    "Plan purpose: interview",
    "Register: tone=neutral",
    "Current task: Answer bank: quality of earnings",
    "Current page (beat): tap-to-notes",
    `WHAT'S ON THE PAGE THEY'RE READING:\n${fixture.beatContent}`,
    `THEIR RESUME / BACKGROUND (dig material — sentences may trace here):\n${fixture.resume}`,
    `THEIR DIAGNOSTIC ANSWERS (what they already said out loud in the two cold questions):\n${fixture.diagnostic}`,
  ].join("\n\n");
  return [
    { role: "user", content: `CONTEXT (not from the user — the page state):\n${ctx}` },
    { role: "assistant", content: "Understood — I can see the page, materials, and draft. Ready for their question." },
    {
      role: "user",
      content: `Condense this selected transcript moment into ONE cheatsheet note bullet. Bulletpoint only, no raw transcript dump, no invented facts:\n\n"${selectedMoment}"`,
    },
  ];
}

const results = [];
for (const length of lengths) {
  const take1 = makeTake(baseTake, length.takeWords);
  const take2 = makeTake(`${baseTake} I would say the priority is separating sustainable EBITDA from noise, then tying that back to valuation risk.`, length.takeWords + 25);
  const pushAnswer = makeTake(
    "If I only had two hours, I would prioritize the items most likely to change adjusted EBITDA or working capital: large add-backs, non-recurring revenue, margin breaks, and the timing of collections and payables.",
    length.pushWords
  );

  const push = await callClaude({
    label: "push_generation",
    system: COACH_SYSTEM,
    maxTokens: 220,
    schema: PUSH_SCHEMA,
    messages: [{ role: "user", content: pushPrompt(take1) }],
  });

  const review = await callClaude({
    label: "grade_feedback",
    system: COACH_SYSTEM,
    maxTokens: 1024,
    schema: REVIEW_SCHEMA,
    messages: [{ role: "user", content: reviewPrompt({ take1, take2, pushAnswer }) }],
  });

  const note = await callClaude({
    label: "condense_tap",
    system: ASSIST_SYSTEM,
    maxTokens: 140,
    schema: NOTE_SCHEMA,
    messages: notePrompt({ selectedMoment: pushAnswer }),
  });

  const calls = [push, review, note];
  results.push({
    answerLength: length.label,
    takeWords: length.takeWords,
    calls: calls.map(({ text, ...call }) => call),
    total: {
      inputTokens: calls.reduce((sum, c) => sum + c.inputTokens, 0),
      outputTokens: calls.reduce((sum, c) => sum + c.outputTokens, 0),
      costCents: calls.reduce((sum, c) => sum + c.costCents, 0),
    },
  });
}

const allTotals = results.map((r) => r.total.costCents);
const summary = {
  model: MODEL,
  pricing: {
    inputPerMTokUsd: 1,
    outputPerMTokUsd: 5,
    source: "https://claude.com/pricing",
  },
  note: "Transcription is excluded: v1 uses browser Web Speech.",
  results,
  range: {
    minCents: Math.min(...allTotals),
    maxCents: Math.max(...allTotals),
    spreadCents: Math.max(...allTotals) - Math.min(...allTotals),
  },
};

console.log(JSON.stringify(summary, null, 2));
