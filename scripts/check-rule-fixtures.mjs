// Each fixtures/negative/*.json declares expectRuleId: the rule it exists to
// trip. Red: that rule isn't registered yet, or is registered but doesn't flag
// the fixture. Green: the rule is registered and reports an error violation
// for it. Run: npm run check:rules
import fs from "node:fs";
import path from "node:path";
import { RULES, runRules } from "../lib/moduleCheck.js";

const DIR = path.resolve("fixtures/negative");
let failures = 0;

const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith(".json")) : [];

for (const file of files) {
  const rel = `fixtures/negative/${file}`;
  const fixture = JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8"));
  const { expectRuleId, input, output, pool, purpose } = fixture;

  if (!expectRuleId) {
    console.log(`… ${rel}: no expectRuleId yet — skipped (not wired to a rule)`);
    continue;
  }

  const rule = RULES.find((r) => r.id === expectRuleId);
  if (!rule) {
    console.error(`✗ ${rel}: rule "${expectRuleId}" is not registered (red)`);
    failures++;
    continue;
  }

  const result = runRules({ input, output: output ?? null, pool: pool || [], purpose }, [rule]);
  const caught = result.violations.some((v) => v.ruleId === expectRuleId && v.severity === "error");
  if (caught) {
    console.log(`✓ ${rel}: "${expectRuleId}" caught it (green)`);
  } else {
    console.error(`✗ ${rel}: "${expectRuleId}" did NOT flag this fixture (red)`);
    failures++;
  }
}

process.exit(failures ? 1 : 0);
