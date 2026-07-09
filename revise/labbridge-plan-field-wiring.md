# LabBridge — Wiring Extracted Fields into the Plan (build guide)

Threads the `fields` from job-link extraction into the plan the user sees. One governing rule:

> **Field present → render specific. Field null → render non-specific AND invite the missing input. Never fill a null with a guess.**

That rule is what turns "what appears to be a PE role" into either "Associate at [Firm]" (when read) or an honest "add the job description to target this" (when not) — never a confident hallucination in between.

Inputs:
```
fields = { company, role, sector, seniority, responsibilities[], requiredSkills[] }  // any may be null / []
status = 'ok'          // link was read, or text was pasted
       | 'unreadable'  // link failed, no text — we have NO posting
```

---

## Helpers

```js
const val = (v, fallback) => (v && String(v).trim()) ? v : fallback;
const haveTarget = (f, status) =>
  status === 'ok' && (f.company || f.role || (f.responsibilities || []).length);
```

---

## 1. Header

```js
function planHeader(f, status) {
  if (haveTarget(f, status)) {
    const role = val(f.role, 'a new role');
    const at   = f.company ? ` at ${f.company}` : '';
    return `Toward ${role}${at}`;
  }
  // no posting → honest, with a nudge (never echo the raw URL)
  return `Your onboarding plan — add the job description to target a specific role and company`;
}
```

Before: `Toward https://www.linkedin.com/jobs/view/4379699507/...`
After (read): `Toward Private Equity Associate at [Firm]`
After (unread): `Your onboarding plan — add the job description to target a specific role and company`

---

## 2. Firm / sector deep-dive node

```js
function firmNode(f) {
  if (f.company) {
    return {
      title: `${f.company} and sector deep-dive`,
      why: `Applies everything prior to your actual employer — learn ${f.company}'s ` +
           `${val(f.sector, 'sector')} focus, investment criteria, and recent moves so your first task lands in context.`
    };
  }
  // no company → stay generic, and do NOT pretend to know the firm
  return {
    title: `Target firm and sector deep-dive`,
    why: `Applies everything prior to your specific employer. Add the job posting or company name to make this concrete.`
  };
}
```

This is the node that read "memorize *the firm's* criteria" with no firm named. With `company` present it names the firm; without it, it *says* it needs the firm rather than referencing one it doesn't have.

---

## 3. First task — grounded in real responsibilities

```js
function firstTaskIntro(f) {
  const resp = (f.responsibilities || []).slice(0, 3);
  if (resp.length) {
    return `Scoped to what this role actually does — ${resp.join('; ')} — here's a week-one task ` +
           `that exercises your existing strengths against those duties.`;
  }
  return `A representative week-one task. Paste the job description (or a real ticket) to tie this ` +
         `to your team's actual first assignment.`;
}
```

The self-check in your test flagged that the first task leaned on unstated "firm's target sector" details. With `responsibilities` and `company` available, those references become real; without them, the intro *admits* it's representative instead of implying specifics it lacks.

---

## 4. Weighting — a read posting anchors the target; an unread one must not

```js
// in the matching step
if (haveTarget(f, status)) {
  target.weight = 'high';   // a genuinely read posting is the strongest target signal
} else {
  target.weight = 0;        // an unread link told us NOTHING — it must not steer the plan
  plan.notes.push(
    'This plan is built from your background only. Add the job description to target a specific role.'
  );
}
```

This is the fix for the silent-degradation bug at its root: an unread link contributes **zero** target weight instead of quietly letting the resume masquerade as the target.

---

## 5. One honest banner on the review screen

```js
function ingestionBanner(status, reason) {
  if (status === 'ok') return null;
  const why = reason === 'login_wall' ? ' (LinkedIn blocks automated reading)' : '';
  return `We couldn't read that link${why}. This plan is built from your background only — ` +
         `paste the job description text to target it precisely.`;
}
```

Surface this on the single review screen (alongside the weighting summary and any `needs_review` flags). It's the visible-assumption pattern again: the same way `isBeginner` says "assuming you're starting fresh," this says "assuming background-only, here's how to sharpen it." The assumption is stated and correctable, never silent.

---

## The pattern across all five

Every substitution follows the same shape: **check the field, render specific if present, render honest-and-inviting if absent.** No branch ever invents a company, a sector, or a responsibility. That's what makes the plan trustworthy *and* keeps it useful when input is thin — it degrades to honesty, not to fiction.
```
