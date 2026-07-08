// Job-link ingestion (server-side). Fetch the URL for real, strip to text,
// validate we actually got a posting (not a login wall / stub), then extract
// fields grounded in that text only. "Couldn't read it" is a first-class
// outcome — the client falls back to a paste box. Never guess from a URL.
import { client, MODEL } from "@/lib/ai";

const TIMEOUT_MS = 9000;

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|li|h[1-6]|br|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*/g, "\n\n")
    .trim();
}

function validateContent(text, html) {
  if (!text || text.length < 400) return { ok: false, reason: "too_short" };
  const lower = text.toLowerCase();
  const wall = [
    "sign in to continue",
    "join linkedin",
    "log in to view",
    "you must be logged in",
    "please enable javascript",
    "create your free account",
    "authwall",
  ];
  const hits = wall.filter((m) => lower.includes(m)).length;
  if ((hits >= 2 && text.length < 1500) || /authwall|uas\/login/i.test(html)) {
    return { ok: false, reason: "login_wall" };
  }
  return { ok: true };
}

const EXTRACT_SYSTEM = `You extract fields from a job posting. Use ONLY the provided text. Do NOT infer or invent. If a field is not clearly present in the text, return an empty string "" (or [] for lists). Never fill a field from outside knowledge.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    company: { type: "string" },
    role: { type: "string" },
    sector: { type: "string" },
    seniority: { type: "string" },
    responsibilities: { type: "array", items: { type: "string" } },
    requiredSkills: { type: "array", items: { type: "string" } },
  },
  required: ["company", "role", "sector", "seniority", "responsibilities", "requiredSkills"],
};

async function extractFields(text) {
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: EXTRACT_SYSTEM,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: `POSTING TEXT:\n${text.slice(0, 12000)}` }],
    });
    const block = message.content.find((b) => b.type === "text");
    if (!block) return null;
    const f = JSON.parse(block.text);
    const nn = (s) => (s && String(s).trim() ? String(s).trim() : null);
    return {
      company: nn(f.company),
      role: nn(f.role),
      sector: nn(f.sector),
      seniority: nn(f.seniority),
      responsibilities: Array.isArray(f.responsibilities) ? f.responsibilities.filter(Boolean).slice(0, 8) : [],
      requiredSkills: Array.isArray(f.requiredSkills) ? f.requiredSkills.filter(Boolean).slice(0, 12) : [],
    };
  } catch {
    return null;
  }
}

export async function POST(request) {
  let url = "";
  try {
    url = (await request.json())?.url || "";
  } catch {
    return Response.json({ ok: false, reason: "bad_url" }, { status: 400 });
  }
  if (!url || !/^https?:\/\//i.test(url)) return Response.json({ ok: false, reason: "bad_url" });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let html = "";
  try {
    const resp = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LabBridgeBot/1.0; +https://labbridge.app)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!resp.ok) return Response.json({ ok: false, reason: `http_${resp.status}` });
    html = await resp.text();
  } catch {
    return Response.json({ ok: false, reason: "fetch_failed" });
  } finally {
    clearTimeout(timer);
  }

  const text = htmlToText(html);
  const check = validateContent(text, html);
  if (!check.ok) return Response.json({ ok: false, reason: check.reason });

  const fields = process.env.ANTHROPIC_API_KEY ? await extractFields(text) : null;
  return Response.json({ ok: true, text: text.slice(0, 12000), fields });
}
