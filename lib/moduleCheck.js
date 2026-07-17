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
const INTERVIEW_SECTIONS = new Set(["fit", "track_record", "capability", "judgment"]);
const INTERVIEW_TAGS = new Set(["", "start_here", "you_named_this", "blind_spot"]);

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

function isInterviewModule(module) {
  return !!(module?.section || module?.tag);
}

function isTaggedQuestionSkippable(module) {
  return module?.tag !== "you_named_this" && module?.tag !== "blind_spot";
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
  if (modules.some(isInterviewModule) || options.purpose === "interview") {
    findings.push(...checkInterviewMap(modules));
  }
  return { ok: findings.every((f) => f.severity !== "error"), findings };
}

function checkInterviewMap(modules) {
  const findings = [];
  const startHere = modules.filter((m) => m?.tag === "start_here");
  if (startHere.length !== 1) {
    findings.push({
      code: "interview_start_here_count",
      severity: "error",
      path: "learningSequence[].tag",
      message: `Interview map needs exactly one start_here tag; found ${startHere.length}.`,
    });
  }

  const sectionCounts = {};
  modules.forEach((module, index) => {
    if (!INTERVIEW_SECTIONS.has(module?.section || "")) {
      findings.push(makeFinding(index, "interview_bad_section", "Interview question section must be fit, track_record, capability, or judgment.", "section", "error"));
    }
    if (!INTERVIEW_TAGS.has(module?.tag || "")) {
      findings.push(makeFinding(index, "interview_bad_tag", "Interview question tag must be start_here, you_named_this, blind_spot, or empty.", "tag", "error"));
    }
    if (!asText(module?.why).trim()) {
      findings.push(makeFinding(index, "interview_missing_receipt", "Every interview question needs a receipt in why: JD line, resume line, diagnostic result, round convention, or pasted interviewer background.", "why", "error"));
    }
    if ((module?.tag === "you_named_this" || module?.tag === "blind_spot") && module?.skippable === true) {
      findings.push(makeFinding(index, "interview_tagged_skippable", "Tagged questions must not be skippable; render should require this prep.", "tag", "error"));
    }
    if (module?.section) sectionCounts[module.section] = (sectionCounts[module.section] || 0) + 1;
  });

  const counts = Object.values(sectionCounts);
  if (modules.length >= 4 && counts.length === 4 && new Set(counts).size === 1) {
    findings.push({
      code: "interview_padded_sections",
      severity: "warn",
      path: "learningSequence[].section",
      message: "Interview map gives every section the same count; verify this is a real mix, not padding to fill four containers.",
    });
  }

  return findings;
}

export { BANNED_PHRASES, DEFAULT_THRESHOLDS, isTaggedQuestionSkippable };
