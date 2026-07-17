const DEFAULT_THRESHOLDS = {
  conceptExplanationChars: 500,
  workedExampleSetupChars: 120,
  minGivenInputs: 1,
  minSelfCheckCriteria: 3,
  minTaskSteps: 3,
};

const BANNED_PHRASES = [
  "find a dataset",
  "search online",
  "read about",
  "learn about",
  "simulate your own",
];

const STAKEHOLDER_RE = /\b(lead|manager|partner|team|stakeholder|clinician|medical affairs|heor|data engineer|engineer|designer|pm|customer|client|reviewer|analyst|mentor|supervisor)\b/i;

export const RULES = [];

export function registerRule(rule) {
  if (!rule || typeof rule !== "object") {
    throw new TypeError("Rule must be an object.");
  }
  const { id, severity, describe, check } = rule;
  if (!id || typeof id !== "string") {
    throw new TypeError("Rule must include a string id.");
  }
  if (!["error", "warn", "info"].includes(severity)) {
    throw new TypeError(`Rule "${id}" must use severity "error", "warn", or "info".`);
  }
  if (typeof describe !== "function") {
    throw new TypeError(`Rule "${id}" must include describe().`);
  }
  if (typeof check !== "function") {
    throw new TypeError(`Rule "${id}" must include check(ctx).`);
  }
  RULES.push(rule);
  return rule;
}

function normalizeViolation(rule, violation) {
  const message = violation?.message || rule.describe();
  const path = violation?.path || "";
  return {
    ruleId: violation?.ruleId || rule.id,
    severity: violation?.severity || rule.severity,
    message,
    path,
  };
}

export function runRules(ctx, rules = RULES) {
  const violations = [];

  for (const rule of rules) {
    const result = rule.check(ctx) || [];
    if (!Array.isArray(result)) {
      throw new TypeError(`Rule "${rule.id}" returned a non-array result.`);
    }
    violations.push(...result.map((violation) => normalizeViolation(rule, violation)));
  }

  return {
    ok: violations.every((violation) => violation.severity !== "error"),
    violations,
  };
}

function asText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(asText).join(" ");
  if (typeof value === "object") return Object.values(value).map(asText).join(" ");
  return String(value);
}

function charCount(value) {
  return asText(value).trim().length;
}

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function makeFinding(moduleIndex, code, message, path, severity = "warn") {
  return { moduleIndex, code, severity, path, message };
}

function assignmentText(task) {
  return asText({
    managerRequest: task?.managerRequest,
    title: task?.title,
    givenInputs: task?.givenInputs,
    deliverable: task?.deliverable,
    steps: task?.steps,
  });
}

function checkBannedPhrases(task, moduleIndex) {
  const text = assignmentText(task).toLowerCase();
  return BANNED_PHRASES.filter((phrase) => text.includes(phrase)).map((phrase) =>
    makeFinding(
      moduleIndex,
      "banned_phrase",
      `Avoid "${phrase}" — modules should hand the learner realistic inputs instead of sending them away.`,
      "task",
      "error"
    )
  );
}

export function checkModule(module, moduleIndex = 0, options = {}) {
  const thresholds = { ...DEFAULT_THRESHOLDS, ...(options.thresholds || {}) };
  const findings = [];
  const concept = module?.concept || {};
  const workedExample = module?.workedExample || {};
  const task = module?.task || {};
  const selfCheck = module?.selfCheck || {};

  if (charCount(concept.explanation) < thresholds.conceptExplanationChars) {
    findings.push(
      makeFinding(
        moduleIndex,
        "thin_concept",
        `Concept explanation is ${charCount(concept.explanation)} chars; aim for at least ${thresholds.conceptExplanationChars} so the module teaches before assigning.`,
        "concept.explanation"
      )
    );
  }

  if (charCount(workedExample.setup) < thresholds.workedExampleSetupChars) {
    findings.push(
      makeFinding(
        moduleIndex,
        "thin_worked_example",
        `Worked example setup is ${charCount(workedExample.setup)} chars; use a tiny concrete object the learner can reason through.`,
        "workedExample.setup"
      )
    );
  }

  if (arrayValue(task.givenInputs).length < thresholds.minGivenInputs) {
    findings.push(
      makeFinding(
        moduleIndex,
        "missing_given_inputs",
        "Task needs named inputs the learner is handed, such as a file, ticket, draft, or starter list.",
        "task.givenInputs",
        "error"
      )
    );
  }

  if (!STAKEHOLDER_RE.test(asText(task.managerRequest))) {
    findings.push(
      makeFinding(
        moduleIndex,
        "weak_manager_request",
        "Manager request should read like a stakeholder ask, e.g. a lead, partner, team, clinician, or client asking for work.",
        "task.managerRequest"
      )
    );
  }

  if (arrayValue(selfCheck.criteria).length < thresholds.minSelfCheckCriteria) {
    findings.push(
      makeFinding(
        moduleIndex,
        "thin_self_check",
        `Self-check has ${arrayValue(selfCheck.criteria).length} criteria; include at least ${thresholds.minSelfCheckCriteria} practical criteria.`,
        "selfCheck.criteria"
      )
    );
  }

  if (arrayValue(task.steps).length < thresholds.minTaskSteps) {
    findings.push(
      makeFinding(
        moduleIndex,
        "thin_task_steps",
        `Task has ${arrayValue(task.steps).length} steps; include at least ${thresholds.minTaskSteps} concrete steps.`,
        "task.steps"
      )
    );
  }

  findings.push(...checkBannedPhrases(task, moduleIndex));
  return findings;
}

export function checkPlan(plan, options = {}) {
  const modules = arrayValue(plan?.learningSequence);
  const findings = [];

  if (!modules.length) {
    findings.push({
      code: "missing_learning_sequence",
      severity: "error",
      path: "learningSequence",
      message: "Plan has no learningSequence modules to check.",
    });
    return { ok: false, findings };
  }

  modules.forEach((module, index) => findings.push(...checkModule(module, index, options)));
  return { ok: findings.every((f) => f.severity !== "error"), findings };
}

export { BANNED_PHRASES, DEFAULT_THRESHOLDS };
