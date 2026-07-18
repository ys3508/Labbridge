import { stableFingerprint } from "./textFingerprint.js";

const WEAKNESS = { missing: 1, thin: 0.6, met: 0.1 };

const ROUND_WEIGHTS = {
  recruiter: { substance: 0.1, delivery: 0.5, story: 0.4 },
  technical: { substance: 0.7, delivery: 0.3, story: 0 },
  hiring_manager: { substance: 0.4, delivery: 0.3, story: 0.3 },
  case: { substance: 0.5, delivery: 0.5, story: 0 },
  panel: { substance: 0.3, delivery: 0.4, story: 0.3 },
  not_sure: { substance: 0.34, delivery: 0.33, story: 0.33 },
};

export function normalizeRound(round = "") {
  const r = String(round).toLowerCase();
  if (/recruit|screen|phone/.test(r)) return "recruiter";
  if (/tech|coding|whiteboard|system|case|exercise/.test(r) && !/case/.test(r)) return "technical";
  if (/hiring|manager|team/.test(r)) return "hiring_manager";
  if (/case|exercise|take[- ]?home/.test(r)) return "case";
  if (/final|panel|onsite/.test(r)) return "panel";
  return "not_sure";
}

export function weaknessForStatus(status) {
  return WEAKNESS[status] ?? 0.6;
}

export function statusWord(status) {
  if (status === "met") return "strong";
  if (status === "thin") return "getting there";
  return "not yet";
}

export function challengeKind({ contentFears = [], obstacles = [], challenge = "" } = {}) {
  const text = [...contentFears, ...obstacles, challenge].filter(Boolean).join(" ").toLowerCase();
  if (/layoff|laid off|gap|break|fired|why you|background|story|career/.test(text)) return "story";
  if (/freez|panic|nerv|rambl|concise|structure|language|english|accent|confidence/.test(text)) return "delivery";
  if (contentFears.length || /technical|case|model|sql|code|system|design|method|question|concept/.test(text)) return "substance";
  return "story";
}

export function runwayBucket(date, now = new Date()) {
  if (!date) return "weeks";
  const target = new Date(`${date}T12:00:00`);
  if (Number.isNaN(target.getTime())) return "weeks";
  const days = Math.ceil((target.getTime() - now.getTime()) / 86400000);
  if (days <= 1) return "tomorrow";
  if (days <= 6) return "few_days";
  return "weeks";
}

export function runwayPlan(bucket) {
  if (bucket === "tomorrow") {
    return {
      label: "Sprint",
      copy: "We do not have long, so the plan should stay focused: one lever, one mock, then the walk-in card.",
      volume: "one lever, one mock, the card",
      limit: 1,
    };
  }
  if (bucket === "few_days") {
    return {
      label: "Focused run",
      copy: "There is room for a few reps, not a wall of drills. Work the top two or three in order.",
      volume: "top 2-3 priorities, in order",
      limit: 3,
    };
  }
  return {
    label: "Full build",
    copy: "There is enough runway for the full ordered map, with the highest-leverage work first.",
    volume: "full ordered map",
    limit: null,
  };
}

function verdict(results, key, index) {
  return results?.[key]?.review?.criteria?.[index] || null;
}

function score({ status, kind, roundKey, boost = 0 }) {
  const weights = ROUND_WEIGHTS[roundKey] || ROUND_WEIGHTS.not_sure;
  return weaknessForStatus(status) * (weights[kind] ?? 0.33) + boost;
}

export function buildTriagePriorities({ diagnosticResults = {}, intake = {}, meta = {}, now } = {}) {
  const roundKey = normalizeRound(meta.round || "");
  const q1Substance = verdict(diagnosticResults, "q1", 0);
  const q1Delivery = verdict(diagnosticResults, "q1", 1);
  const q2Substance = verdict(diagnosticResults, "q2", 0);
  const q2Delivery = verdict(diagnosticResults, "q2", 1);
  const named = (meta.challenge || "").trim() || [...(intake.contentFears || []), ...(intake.obstacles || [])].filter(Boolean).join("; ");
  const namedKind = challengeKind({ contentFears: intake.contentFears, obstacles: intake.obstacles, challenge: named });
  const namedStatus = named ? "thin" : "met";
  const mappedBoost = namedKind === "substance" || namedKind === "delivery" ? 0.12 : 0;
  const rows = [
    {
      dimension: "substance",
      label: "Substance",
      status: q2Substance?.status || (diagnosticResults.q2Skipped ? "missing" : "thin"),
      evidence: q2Substance?.note || (diagnosticResults.q2Skipped ? "Q2 was skipped, so this read is intentionally thin." : "The technical read is still early."),
      kind: "substance",
      rationale: q2Substance?.note || "Role-specific substance needs a first-pass read.",
      expectation: "Substance can move when the plan picks the right concepts and pressure-tests them against the posting.",
    },
    {
      dimension: "delivery",
      label: "Delivery",
      status: q1Delivery?.status || "thin",
      evidence: q1Delivery?.note || "The opener gives the first delivery read.",
      kind: "delivery",
      rationale: q1Delivery?.note || "The opener showed how the answer lands before pressure.",
      expectation: "Delivery is usually movable quickly: lead with the point, cut the drift, and rehearse the first sentence.",
      boost: namedKind === "delivery" ? mappedBoost : 0,
    },
    {
      dimension: "named_challenge",
      label: named ? "The thing you named" : "Your story",
      status: namedStatus,
      evidence: named ? `You named: ${named}` : q1Substance?.note || "No specific challenge was named, so the story row stays light.",
      kind: named ? namedKind : "story",
      rationale: named ? `You named this as hard, so it stays in the order even if two answers cannot fully measure it.` : q1Substance?.note || "Your story still has to connect your background to this room.",
      expectation:
        namedKind === "delivery"
          ? "We may not change the trait itself; the goal is to make it manageable in the room."
          : namedKind === "story"
            ? "This can become answerable when it is built from evidence instead of defended from panic."
            : "If this is the topic you dread, it gets framed before it gets tested.",
      forceIncluded: true,
      boost: namedKind === "substance" ? mappedBoost : 0,
    },
  ];

  return rows
    .map((row) => ({
      ...row,
      roundKey,
      score: score({ status: row.status, kind: row.kind, roundKey, boost: row.boost || 0 }),
      source: "computed",
    }))
    .sort((a, b) => b.score - a.score)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

// The diagnostic read that produced a triage order, fingerprinted. Restoring a
// saved order across a CHANGED read is the staleness bug: 399d885 gated restore on
// override-ness (the wrong axis) — a user correction is only still valid if the
// READ that produced it is unchanged. "Materially" = the per-axis verdicts plus
// whether Q2 was skipped; the free-text ammunition line doesn't move the ranking,
// so it doesn't move the print.
export function diagnosticFingerprint(diagnosticResults = {}) {
  const axis = (key, i) => diagnosticResults?.[key]?.review?.criteria?.[i]?.status || "-";
  return stableFingerprint({
    q1Substance: axis("q1", 0),
    q1Delivery: axis("q1", 1),
    q2Substance: axis("q2", 0),
    q2Delivery: axis("q2", 1),
    q2Skipped: Boolean(diagnosticResults.q2Skipped),
  });
}

// Pure restore decision for a saved triage order given the current read's print.
// - "restore":   a user correction whose read is unchanged — keep it.
// - "reoffer":   a user correction from a DIFFERENT read — recompute from the
//                fresh read, but surface the old order so the correction isn't lost
//                silently (Sissi, 2026-07-18: "we interpret; you correct" means a
//                correction shouldn't vanish without the user seeing it).
// - "recompute": nothing worth keeping — use the fresh computed order.
// Old saved records predating the fingerprint field have `fingerprint === undefined`,
// so a stored correction we can't verify re-offers rather than silently restoring.
export function triageRestoreDecision(saved, currentFingerprint) {
  const hasCorrection = saved?.userOverride && Array.isArray(saved.priority) && saved.priority.length > 0;
  if (!hasCorrection) return "recompute";
  return saved.fingerprint === currentFingerprint ? "restore" : "reoffer";
}

export function triageStorageKey(meta = {}) {
  const seed = [meta.role, meta.company, meta.round, meta.format, meta.date, meta.challenge].filter(Boolean).join("|");
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return `lb_triage_${(h >>> 0).toString(36)}`;
}

export function serializePriority(priority = []) {
  return priority.map(({ dimension, rank, rationale, source }) => ({ dimension, rank, rationale, source }));
}

export function triageInstructions(priority = [], { runway, overrideNote } = {}) {
  const lines = [
    "TRIAGE PRIORITY (mutable; build the Question Map in this order unless later practice changes it):",
    ...serializePriority(priority).map((p) => `${p.rank}. ${p.dimension} — ${p.rationale} [source=${p.source}]`),
    runway && `Runway volume: ${runway.volume}. Fast changes volume, not warmth.`,
    overrideNote && `User correction: ${overrideNote}`,
  ].filter(Boolean);
  return lines.join("\n");
}
