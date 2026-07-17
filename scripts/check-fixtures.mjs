import fs from "node:fs";
import path from "node:path";
import { RULES, runRules } from "../lib/moduleCheck.js";

const FIXTURE_DIR = path.resolve("fixtures");
const VALID_PURPOSES = new Set(["starting_role", "interview", "career_move", "curious"]);

// fixtures/negative/ holds fixtures that are SUPPOSED to trip a rule — they are
// checked separately by scripts/check-rule-fixtures.mjs, which asserts each one
// is caught. Sweeping them in here would make this "must stay clean" golden
// scan permanently fail the moment a rule catches what it was built to catch.
function collectJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    if (entry.isDirectory() && entry.name === "negative") return [];
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectJsonFiles(fullPath);
    if (entry.isFile() && entry.name.endsWith(".json")) return [fullPath];
    return [];
  });
}

function readFixture(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const fixture = JSON.parse(raw);
  const input = fixture.input || fixture;
  const purpose = fixture.purpose || input?.goals?.purpose;
  return {
    name: path.relative(process.cwd(), filePath),
    ctx: {
      input,
      output: fixture.output || null,
      pool: fixture.pool || [],
      purpose,
    },
  };
}

function fail(message) {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
}

function logViolation(fixtureName, violation) {
  const location = violation.path ? ` (${violation.path})` : "";
  console.error(`✗ ${fixtureName}: [${violation.ruleId}] ${violation.message}${location}`);
}

const files = collectJsonFiles(FIXTURE_DIR);
if (!files.length) {
  fail("No JSON fixtures found.");
  process.exit();
}

const fixtures = files.map(readFixture);
const purposes = new Set(fixtures.map((fixture) => fixture.ctx.purpose).filter(Boolean));

for (const purpose of VALID_PURPOSES) {
  if (!purposes.has(purpose)) {
    fail(`Missing fixture coverage for purpose "${purpose}".`);
  }
}

for (const fixture of fixtures) {
  if (!VALID_PURPOSES.has(fixture.ctx.purpose)) {
    fail(`${fixture.name} has invalid or missing purpose "${fixture.ctx.purpose}".`);
  }

  const result = runRules(fixture.ctx);
  for (const violation of result.violations) {
    if (violation.severity === "error") {
      logViolation(fixture.name, violation);
      process.exitCode = 1;
    }
  }
}

if (!process.exitCode) {
  console.log(`✓ ${fixtures.length} fixtures checked with ${RULES.length} registered rules`);
}
