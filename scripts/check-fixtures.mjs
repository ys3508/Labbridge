// CI smoke: fixtures parse with the buildPayload shape, and the static checker
// passes a healthy Shift-1 module (teaching prose may say "learn about") while
// flagging pointer-style assignments. Zero API. Run: npm run check
import fs from "node:fs";
import { checkModule } from "../lib/moduleCheck.js";

let failures = 0;
const fail = (msg) => { console.error("✗", msg); failures++; };
const ok = (msg) => console.log("✓", msg);

for (const f of fs.readdirSync("fixtures").filter((x) => x.endsWith(".json"))) {
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

process.exit(failures ? 1 : 0);
