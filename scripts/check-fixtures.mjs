// CI smoke: fixtures parse with the buildPayload shape, and the static checker
// passes a healthy Shift-1 module (teaching prose may say "learn about") while
// flagging pointer-style assignments. Zero API. Run: npm run check
import fs from "node:fs";
import { checkModule, checkPlan } from "../lib/moduleCheck.js";
import { diagnosticFingerprint, triageRestoreDecision } from "../lib/triage.js";
import {
  receiptMatchesSource,
  shouldAcknowledgeQ2Reset,
  shouldReuseFingerprint,
  stableFingerprint,
} from "../lib/textFingerprint.js";

let failures = 0;
const fail = (msg) => { console.error("✗", msg); failures++; };
const ok = (msg) => console.log("✓", msg);

// Plan-input fixtures (the golden-*-input.json set) get the payload-shape check.
// Other fixtures (e.g. coach eval cases) are validated separately below.
for (const f of fs.readdirSync("fixtures").filter((x) => x.endsWith("-input.json"))) {
  const p = JSON.parse(fs.readFileSync(`fixtures/${f}`, "utf8"));
  if (p.background && p.target && p.goals && p.timeline) ok(`${f} parses with payload shape`);
  else fail(`${f} missing payload sections`);
}

const healthy = {
  concept: { explanation: "Here you learn about enrollment spans. Read about the claims lifecycle. ".repeat(8) },
  workedExample: { setup: "Patient 104: continuous enrollment Jan-Dec, two E11 claims, one metformin fill, one endocrinology visit in May." },
  task: {
    title: "Data orientation memo",
    managerRequest: "Your RWE lead says: profile this extract.",
    givenInputs: ["claims_sample.csv"],
    steps: ["Profile tables", "Trace a patient", "List limitations"],
    deliverable: "One-page memo", doneWhen: "Counts reproduce", stakeholders: "RWE lead",
  },
  selfCheck: { criteria: ["a", "b", "c"], redFlags: ["x"] },
};
const bad = structuredClone(healthy);
bad.task.steps = ["Find a dataset online", "Simulate your own claims"];

if (checkModule(healthy, 0).filter((x) => x.severity === "error").length === 0) ok("healthy module passes (teaching prose may say 'learn about')");
else fail("healthy module flagged");
if (checkModule(bad, 0).some((x) => x.code === "banned_phrase")) ok("pointer-style assignment flagged");
else fail("bad assignment not flagged");

const interviewMap = {
  learningSequence: [
    { section: "fit", tag: "start_here", why: "JD: role asks for stakeholder summaries", concept: healthy.concept, workedExample: healthy.workedExample, task: healthy.task, selfCheck: healthy.selfCheck },
    { section: "capability", tag: "", why: "JD: cohort definitions", concept: healthy.concept, workedExample: healthy.workedExample, task: healthy.task, selfCheck: healthy.selfCheck },
    { section: "judgment", tag: "blind_spot", why: "Diagnostic: missed limitations", concept: healthy.concept, workedExample: healthy.workedExample, task: healthy.task, selfCheck: healthy.selfCheck },
  ],
};
const badInterviewMap = structuredClone(interviewMap);
badInterviewMap.learningSequence[0].tag = "";
badInterviewMap.learningSequence[1].why = "";

if (checkPlan(interviewMap, { purpose: "interview" }).findings.filter((x) => x.severity === "error").length === 0) ok("healthy interview map passes map rules");
else fail("healthy interview map flagged");
const badFindings = checkPlan(badInterviewMap, { purpose: "interview" }).findings;
if (badFindings.some((x) => x.code === "interview_start_here_count") && badFindings.some((x) => x.code === "interview_missing_receipt")) ok("bad interview map flags start_here and missing receipt");
else fail("bad interview map did not flag map rules");

// Coach axis separation (drill spec fork 4). The verdict itself is a paid eval;
// here we lock the two things a zero-API run can prove: the L2 reference case
// stays well-formed (strong substance, weak delivery), and the axis-separation
// rule cannot silently vanish from the coach prompt.
const l2 = JSON.parse(fs.readFileSync("fixtures/coach-axis-l2.json", "utf8"));
if (l2.draft && l2.expected?.substance === "met" && l2.expected?.delivery === "thin") ok("L2 axis fixture well-formed (strong substance, weak delivery)");
else fail("L2 axis fixture malformed");
const coachPrompt = fs.readFileSync("app/api/coach/route.js", "utf8");
if (/AXIS SEPARATION/.test(coachPrompt) && /never lower the SUBSTANCE/i.test(coachPrompt)) ok("coach prompt keeps the spoken-answer axis-separation rule");
else fail("coach prompt lost the axis-separation rule");

// Dig spark stance (revise/2026-07-18-dig-spark-stance.md — supersedes 886fe43's
// dig Rules 1 & 2). Zero-API lock: the interview-dig prompt now OFFERS sparks and
// keeps the one hard line (never assert an unclaimed fact as the user's history),
// and must NOT carry the reversed "sentences must trace to their material" ban.
const assistPrompt = fs.readFileSync("app/api/assist/route.js", "utf8");
if (/spark stance/i.test(assistPrompt) && /NEVER ASSERT AN UNCLAIMED FACT/i.test(assistPrompt)) ok("assist prompt keeps the dig spark stance + the one hard line");
else fail("assist prompt lost the dig spark stance or the one hard line");
if (!/SENTENCES must come from THEM/i.test(assistPrompt) && !/must trace to something they actually/i.test(assistPrompt)) ok("assist prompt dropped the superseded 'sentences must trace' ban");
else fail("assist prompt still carries the superseded 'sentences must trace' ban");

// ADR-0005 (freeze on mic). Two zero-API locks so a CLOSED gate cannot re-open
// into prose: 10s is a NAMED constant (§5 — "the number most likely to be
// wrong"), and the freeze lifeline — the ADR's own named reference test case for
// tone-dial coverage of static strings — keeps BOTH a gentle and a neutral
// register. If a freeze-path string ever loses its dial coverage, this fails.
const voiceSrc = fs.readFileSync("components/VoiceInput.js", "utf8");
if (/FREEZE_MS\s*=\s*10000/.test(voiceSrc)) ok("freeze threshold is a named 10s constant (ADR-0005 §5)");
else fail("freeze threshold is not a named 10s constant (ADR-0005 §5)");
if (/No rush/.test(voiceSrc) && /Pick the thread back up/.test(voiceSrc)) ok("freeze lifeline keeps both gentle and neutral registers (ADR-0005 dial coverage)");
else fail("freeze lifeline lost a tone register (ADR-0005 dial coverage)");

// Triage stale-restore fix (post-audit item 2). The restore decision keys on the
// diagnostic READ, not just interview meta: same read → restore a correction,
// changed read → re-offer (never silently restore a stale order over a different
// weakness profile). Pure functions, zero API.
const readA = {
  q1: { review: { criteria: [{ status: "met" }, { status: "thin" }] } },
  q2: { review: { criteria: [{ status: "thin" }, { status: "missing" }] } },
};
const readB = structuredClone(readA);
readB.q2.review.criteria[0].status = "met"; // a materially different substance read
const fpA = diagnosticFingerprint(readA);
const fpB = diagnosticFingerprint(readB);
if (fpA === diagnosticFingerprint(structuredClone(readA))) ok("diagnostic fingerprint is stable for the same read");
else fail("diagnostic fingerprint not stable for the same read");
if (fpA !== fpB) ok("diagnostic fingerprint changes when a verdict changes");
else fail("diagnostic fingerprint blind to a changed verdict");
const correction = { userOverride: true, priority: [{ dimension: "delivery" }], fingerprint: fpA };
if (triageRestoreDecision(correction, fpA) === "restore") ok("unchanged read restores the user's correction");
else fail("unchanged read did not restore the correction");
if (triageRestoreDecision(correction, fpB) === "reoffer") ok("changed read re-offers the stale correction (never silent restore)");
else fail("changed read did not re-offer the stale correction");
if (triageRestoreDecision({ userOverride: false, priority: [{}], fingerprint: fpA }, fpA) === "recompute") ok("a non-correction recomputes from the fresh read");
else fail("a non-correction did not recompute");

// Intake reuse + receipt attribution (revise/2026-07-18-reuse-fingerprint-and-
// receipt-attribution.md). One normalized payload fingerprint drives the re-fetch
// guard; Q2 answer discard is separate and fires only when the actual Q2 text
// changed AND there is a real prior answer to discard.
const intakePayloadA = {
  jd: "Own quality of earnings diligence for sponsor-backed deals.",
  challenge: "I freeze on accounting questions.",
  round: "Middle",
  interviewer_kind: "Hiring manager",
  format: "Video",
  seniority: "First role in this field",
  resume: "Built three-statement operating models for 115 franchise units.",
};
const intakePayloadWhitespace = {
  ...intakePayloadA,
  jd: "  Own   quality of earnings diligence\nfor sponsor-backed deals.  ",
  challenge: "I freeze   on accounting questions.",
};
const intakePayloadSenior = { ...intakePayloadA, seniority: "Senior in this field" };
const intakeFp = stableFingerprint(intakePayloadA);
if (shouldReuseFingerprint(intakeFp, intakePayloadWhitespace)) ok("intake payload fingerprint is stable under whitespace normalization");
else fail("intake payload fingerprint changed for whitespace-only edits");
if (!shouldReuseFingerprint(intakeFp, intakePayloadSenior)) ok("intake payload fingerprint changes on seniority-only edit");
else fail("intake payload fingerprint reused after seniority-only edit");
if (!shouldAcknowledgeQ2Reset({ oldQ2: "Old question?", newQ2: "Old question?", priorDiagnostic: { q2: { answer: "My answer" } } })) ok("identical Q2 after re-fetch does not discard or acknowledge");
else fail("identical Q2 after re-fetch triggered discard acknowledgment");
if (!shouldAcknowledgeQ2Reset({ oldQ2: "Old question?", newQ2: "New question?", priorDiagnostic: { q2Skipped: true } })) ok("skip-Q2 path does not render discard acknowledgment");
else fail("skip-Q2 path rendered a discard acknowledgment");
if (shouldAcknowledgeQ2Reset({ oldQ2: "Old question?", newQ2: "New question?", priorDiagnostic: { q2: { answer: "My answer" } } })) ok("changed Q2 with a prior answer renders discard acknowledgment");
else fail("changed Q2 with a prior answer did not render discard acknowledgment");

const jdReceiptSource = [
  "Own quality of earnings diligence for sponsor-backed deals, including add-on integration scenarios.",
  "Evaluate working capital peg assumptions before investment committee.",
].join("\n");
const resumeOnlyLine = "Execute middle-market sell-side M&A and strategic advisory engagements";
if (!receiptMatchesSource({ receipt: resumeOnlyLine, sourceText: jdReceiptSource })) ok("receipt attributed to JD fails when quote only exists in resume");
else fail("receipt guard accepted a resume-only quote attributed to the JD");
if (receiptMatchesSource({ receipt: "Own quality of earnings diligence for sponsor-backed deals", sourceText: jdReceiptSource })) ok("receipt guard accepts a correct contiguous JD prefix");
else fail("receipt guard rejected a correct contiguous JD prefix");
if (!receiptMatchesSource({ receipt: "Own quality of earnings diligence for sponsor-backed deals Evaluate working capital peg assumptions", sourceText: jdReceiptSource })) ok("receipt guard rejects stitched non-adjacent JD lines");
else fail("receipt guard accepted a stitched receipt");

// G7 — Q1 tone default closes as NEUTRAL (ADR-0007: tone dials on evidence, not
// arrival). The no-signal case is the intake router's fallback tone; lock it to
// neutral so the closed gate can't re-open into prose.
const intakeSrc = fs.readFileSync("app/api/intake/route.js", "utf8");
if (/const fallback[\s\S]*?tone:\s*"neutral"/.test(intakeSrc)) ok("intake no-signal default tone is neutral (ADR-0007 / G7)");
else fail("intake no-signal default tone is not neutral (ADR-0007 / G7)");

process.exit(failures ? 1 : 0);
