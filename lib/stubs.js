// ---------------------------------------------------------------------------
// STUBBED AI (v1). Deterministic, offline stand-ins for the live model calls.
// Same *shape* as the real thing so the interaction can be tested now, and the
// stubs can be swapped for real calls later without touching the UI.
// Contract everywhere: extract -> show -> let the user edit.
// ---------------------------------------------------------------------------

const URL_RE = /^(https?:\/\/|www\.)|(\b[a-z0-9-]+\.(com|org|io|dev|net|ai|edu|gov)\b)/i;

// True when a string is (or contains) a URL — used to keep a raw link out of
// the role field / header and to flag "you pasted a link where text was expected".
export function looksLikeUrl(s) {
  return /https?:\/\/\S+/i.test((s || "").trim());
}

// Auto-detect whether a pasted item is a link or free text (files come via upload).
export function detectSource(text) {
  const t = (text || "").trim();
  if (!t) return "text";
  if (URL_RE.test(t) && !t.includes(" ")) return "link";
  return "text";
}

// Classify-and-confirm: guess an artifact's type from its content. The user can
// override with a tap — this is a proposal, not a verdict.
export function classifyArtifact(text) {
  const t = (text || "").toLowerCase();
  if (!t.trim()) return "description";

  if (/github\.com|gitlab\.com|\/repo|readme|pull request|\bcommit\b/.test(t))
    return "repo";
  if (
    /responsibilities|requirements|we are hiring|you will|qualifications|job id|apply now|full-time|the ideal candidate/.test(
      t
    )
  )
    return "job_posting";
  if (/doi|abstract|et al\.?|\bfigure \d|methods section|\bcited by\b|arxiv|biorxiv/.test(t))
    return "paper";
  if (/pipeline|workflow|snakemake|nextflow|\bfastq\b|alignment|preprocessing|ingest/.test(t))
    return "pipeline";
  if (/about us|our mission|careers|founded in|headquarters|we build|our team/.test(t))
    return "company_page";
  return "description";
}

// Type -> default weight (Layer 1 of the weighting model). Zero user effort.
export const TYPE_WEIGHT = {
  job_posting: 5, // the target itself -> highest
  repo: 4, // high, but a shape signal
  pipeline: 3, // medium-high, strong domain signal
  paper: 3,
  description: 3,
  company_page: 1, // low, context only
};

export function typeWeight(type) {
  return TYPE_WEIGHT[type] ?? 3;
}

// A small keyword -> skill dictionary. Extraction only, never invention:
// a skill is surfaced only when its evidence phrase is present in the text.
const SKILL_DICT = [
  { skill: "building data pipelines", any: ["etl", "pipeline", "airflow", "ingest"] },
  { skill: "writing code", any: ["python", "java", "javascript", "c++", "programming", "software"] },
  { skill: "statistics", any: ["statistics", "regression", "p-value", "hypothesis", "biostat"] },
  { skill: "machine learning", any: ["machine learning", "ml", "deep learning", "neural", "pytorch", "tensorflow"] },
  { skill: "working with databases", any: ["sql", "postgres", "database", "mysql", "bigquery"] },
  { skill: "cloud / infrastructure", any: ["aws", "gcp", "azure", "docker", "kubernetes", "cloud"] },
  { skill: "reading research papers", any: ["published", "co-author", "manuscript", "peer-review", "journal"] },
  { skill: "lab experiments", any: ["assay", "pcr", "wet lab", "in vitro", "bench", "pipette"] },
  { skill: "clinical experience", any: ["patient", "clinical", "diagnosis", "icu", "nurse", "physician"] },
  { skill: "data visualization", any: ["tableau", "matplotlib", "dashboard", "visualization", "ggplot"] },
  { skill: "project management", any: ["led a team", "managed", "roadmap", "stakeholder", "scrum"] },
  { skill: "genomics", any: ["genom", "dna", "rna", "sequenc", "variant", "gwas"] },
];

const FIELD_HINTS = [
  { field: "Software Engineering", any: ["software engineer", "full stack", "backend", "frontend", "swe"] },
  { field: "Clinical Medicine", any: ["md", "physician", "resident", "clinical", "patient care"] },
  { field: "Public Health", any: ["mph", "public health", "epidemiolog"] },
  { field: "Biology", any: ["biology", "molecular", "cell biology", "biologist"] },
  { field: "Statistics", any: ["statistician", "biostatistics", "statistics degree"] },
  { field: "Data Science", any: ["data scientist", "data science"] },
];

// Live resume analysis (Job 1 only — extract skills as keywords). Job 2's
// analogy generation was cut in v1, so this stub does NOT invent explanations.
export function analyzeResume(text) {
  const t = (text || "").toLowerCase();
  if (t.trim().length < 12) return { skills: [], field: null };

  const skills = [];
  for (const entry of SKILL_DICT) {
    const hit = entry.any.find((kw) => t.includes(kw));
    if (hit) skills.push({ skill: entry.skill, evidence: hit });
  }

  let field = null;
  for (const entry of FIELD_HINTS) {
    if (entry.any.some((kw) => t.includes(kw))) {
      field = entry.field;
      break;
    }
  }

  // de-dupe by skill name, keep first evidence
  const seen = new Set();
  const unique = skills.filter((s) => {
    if (seen.has(s.skill)) return false;
    seen.add(s.skill);
    return true;
  });

  return { skills: unique, field };
}

// "Here's how we read your materials" — the single weighting summary shown on
// the review screen. Points at each artifact and its role; never silent.
export function readMaterials(artifacts, role, instructions) {
  const scored = artifacts
    .filter((a) => (a.text || "").trim())
    .map((a) => ({ ...a, weight: typeWeight(a.type) }));

  if (scored.length === 0 && !role) {
    return { lines: [], focus: null, empty: true };
  }

  const sorted = [...scored].sort((a, b) => b.weight - a.weight);
  const lines = [];

  if (role) {
    lines.push({ label: `role "${role}"`, role: "your stated target", weight: 5 });
  }

  const roleFor = {
    job_posting: "your main target",
    repo: "an example to match",
    pipeline: "a domain signal",
    paper: "a domain signal",
    company_page: "context",
    description: "what you want to learn",
  };

  sorted.forEach((a) => {
    lines.push({
      label: ARTIFACT_LABEL(a.type),
      role: roleFor[a.type] || "context",
      weight: a.weight,
      preview: (a.text || "").slice(0, 60),
    });
  });

  // crude "focus" line from the highest-weight artifact's keywords
  const top = sorted[0];
  let focus = null;
  if (top) {
    const t = (top.text || "").toLowerCase();
    if (/genom|dna|variant|sequenc/.test(t)) focus = "computational genomics";
    else if (/imaging|mri|radiolog|vision/.test(t)) focus = "medical imaging";
    else if (/machine learning|ml|model|neural/.test(t)) focus = "applied machine learning";
    else if (/clinical|patient|trial/.test(t)) focus = "clinical data";
  }

  return { lines, focus, empty: false, instructions: (instructions || "").trim() };
}

function ARTIFACT_LABEL(type) {
  const map = {
    job_posting: "the job posting",
    repo: "the repo",
    pipeline: "the pipeline description",
    paper: "the paper",
    company_page: "the company page",
    description: "your description",
  };
  return map[type] || "the material";
}

// Infer goals from section-02 artifacts (confirm, don't cold-ask).
export function inferGoals(artifacts, hasDeadlineSignal) {
  const types = artifacts.map((a) => a.type);
  let purpose = null;
  if (types.includes("job_posting") || hasDeadlineSignal) purpose = "starting_role";
  else if (types.includes("paper") || types.includes("pipeline")) purpose = "career_move";
  return { purpose };
}

// Detect a start-date signal inside an artifact (prefill deadline; confirm).
export function detectDeadline(artifacts) {
  const re = /(start date|starts?|begins?)\b|(\b\d{1,2}\/\d{1,2}\/\d{2,4}\b)|(in \d+ weeks?)/i;
  return artifacts.some((a) => re.test(a.text || ""));
}

// Fake effort estimate so the timeline reality-check has a real number to show.
// Real engine derives this from the traversal; here we approximate from depth
// and how much target material was supplied.
export function estimateEffortHours(depth, artifactCount) {
  const base = { landscape: 20, functional: 60, deep: 120 };
  const b = base[depth] ?? 40;
  return b + Math.min(artifactCount, 4) * 6;
}
