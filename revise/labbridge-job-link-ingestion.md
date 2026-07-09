# LabBridge — Job-Link Ingestion: fetch, parse, or honestly fail (build guide)

Fixes the weakness from the live test: a job link that was never actually read, so the plan guessed ("what appears to be a PE role") and had no company name. The rule is the same one running through your whole system: **never produce confident content from material you didn't actually read.** So: fetch it for real, check that you got something real, and if you didn't, fail honestly to a paste box.

**This runs server-side.** Client JS can't fetch LinkedIn (CORS + login wall). Put the fetch and the extraction behind a small serverless endpoint; the model API key lives there too.

---

## The flow

```
link artifact
   → [server] fetch the URL (real UA, follow redirects)
   → strip to readable text
   → VALIDATE: did we actually get a posting? (length + login-wall check)
        ├── no  → return { ok:false, reason } → client shows "paste the text" fallback
        └── yes → extract fields from the text (LLM, grounded in that text only)
                    → { company, role, sector, responsibilities, requiredSkills }
                    → thread these into the plan (header, target node, first task)

paste-the-text fallback  → skip fetch, run the SAME extraction on the pasted text
```

The key design point: **"couldn't read it" is a first-class outcome, not an error to hide.** For LinkedIn specifically it will be the *common* path (their job pages are JS-rendered behind an auth wall), and that's fine — the paste fallback covers it cleanly.

---

## 1. The endpoint — fetch + parse + validate

```js
// POST /api/read-link   { url }  →  { ok, text?, reason? }
export default async function handler(req, res) {
  const { url } = req.body || {};
  if (!url || !/^https?:\/\//i.test(url)) return res.json({ ok: false, reason: 'bad_url' });
  try {
    const resp = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LabBridgeBot/1.0; +https://labbridge.app)',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });
    if (!resp.ok) return res.json({ ok: false, reason: `http_${resp.status}` });
    const html = await resp.text();
    const text = htmlToText(html);
    const check = validateContent(text, html);
    if (!check.ok) return res.json({ ok: false, reason: check.reason });
    return res.json({ ok: true, text: text.slice(0, 12000) }); // cap for the LLM
  } catch {
    return res.json({ ok: false, reason: 'fetch_failed' });
  }
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(p|div|li|h[1-6]|br|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n\s*/g, '\n\n').trim();
}

// The honest-fail detector: did we actually get a posting, or a wall / redirect / stub?
function validateContent(text, html) {
  if (!text || text.length < 400) return { ok: false, reason: 'too_short' };
  const lower = text.toLowerCase();
  const wall = ['sign in to continue', 'join linkedin', 'log in to view', 'you must be logged in',
                'please enable javascript', 'create your free account', 'authwall'];
  const hits = wall.filter(m => lower.includes(m)).length;
  if ((hits >= 2 && text.length < 1500) || /authwall|uas\/login/i.test(html))
    return { ok: false, reason: 'login_wall' };
  return { ok: true };
}
```

Notes:
- Plain fetch handles most **ATS boards** well — Greenhouse, Lever, Ashby, company career pages are static and parse cleanly. **LinkedIn / Indeed** are JS-rendered behind walls and will usually hit `login_wall` — that's expected; the paste fallback is the answer, not a headless browser (which is heavy and fragile).
- For better text quality on the pages that *do* fetch, swap `htmlToText` for `@mozilla/readability` + `jsdom`. The regex version is fine to start.

---

## 2. Extraction — grounded in the fetched (or pasted) text

Same endpoint pattern (server-side, key protected). The prompt is constrained the way your checker/builder prompts are: **use only the given text, invent nothing, null when unsure.**

```
You are extracting fields from a job posting. Use ONLY the provided text.
Do NOT infer or invent. If a field is not clearly present, return null (or [] for lists).
Return JSON only.

POSTING TEXT:
{{text}}

Return JSON:
{
  "company":          <string | null>,
  "role":             <string | null>,
  "sector":           <string | null>,
  "seniority":        <string | null>,
  "responsibilities": [<string>, ...],
  "requiredSkills":   [<string>, ...]
}
```

This is what gives you the company name and real responsibilities you were missing — but only because it now runs on text you actually retrieved, never on the model's guess about a URL.

---

## 3. Client wiring + the honest-fail fallback

```js
async function ingestLink(url) {
  const r = await fetch('/api/read-link', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url })
  });
  const data = await r.json();
  if (!data.ok) return { status: 'unreadable', reason: data.reason };   // → show paste box
  const fields = await extractJobFields(data.text);                     // server call (§2)
  return { status: 'ok', text: data.text, fields };
}

// When ingestLink returns 'unreadable', show this instead of proceeding:
//   "We couldn't read that link — LinkedIn blocks automated reading.
//    Paste the job description text here and we'll use it."
// On paste, skip the fetch and run extraction directly:
async function ingestPastedText(pasted) {
  const fields = await extractJobFields(pasted);
  return { status: 'ok', text: pasted, fields };
}
```

The fallback is nearly free because you already accept pasted text as an artifact type. The important behavior change: when a link is unreadable, **do not silently continue on the resume alone** (that's what produced the vague plan). Stop, say so, and ask for the text.

---

## 4. Thread the fields through (so the specifics actually show up)

Once you have `fields`, use them — and fall back gracefully to non-specific language when a field is `null`, never to a confident guess:

- **Header:** `Toward ${fields.role} at ${fields.company}` — not the raw URL.
- **Target / "firm deep-dive" node:** use `fields.company` and `fields.sector` instead of "the firm's criteria."
- **First task:** ground it in `fields.responsibilities` so it references real duties, not placeholders.
- **Weighting:** a successfully-read job posting is a high-weight target signal (per section 02); an *unread* one should carry **no** target weight — it told you nothing.

Optional next step (company enrichment): once you have `fields.company`, you can fetch the company's About/careers page or search it to fill in the extra background you expected — but note the dependency you rediscovered in testing: **that only works after the posting is read.** Fix the read first; the company context follows.

---

## What this changes

- LinkedIn links now fail **honestly** (paste fallback) instead of silently degrading to a resume-only guess.
- ATS/company links get **actually read**, yielding company, role, sector, and responsibilities.
- The plan stops saying "what appears to be" and starts naming the real company and duties — because it's finally working from text it read, not a URL it guessed at.
```
