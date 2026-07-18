// CI smoke: fixtures parse with the buildPayload shape, and the static checker
// passes a healthy Shift-1 module (teaching prose may say "learn about") while
// flagging pointer-style assignments. Zero API. Run: npm run check
import fs from "node:fs";
import { checkModule, checkPlan } from "../lib/moduleCheck.js";

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

process.exit(failures ? 1 : 0);
