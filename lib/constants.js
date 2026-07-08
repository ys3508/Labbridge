// Curated defaults — cross-industry, ordered by relevance, NOT alphabetical.
// These are only seeds for people who skip the resume box; real extraction
// handles specifics. First chips must say "yes, whatever your background."

export const FIELD_SUGGESTIONS = [
  "Software Engineering",
  "Finance",
  "Data Science",
  "Business / Management",
  "Law",
  "Marketing",
  "Design",
  "Public Health",
  "Biology",
  "Statistics",
  "Healthcare",
  "Education",
];

// Plain-language, cross-industry "things people do" — never "Python / R / SQL"
// as the default face (that tells a non-coder the tool isn't for them).
export const SKILL_SUGGESTIONS = [
  "working with data",
  "writing & communication",
  "project management",
  "financial analysis",
  "research",
  "writing code",
  "design",
  "teaching or explaining",
];

export const ARTIFACT_TYPES = [
  { key: "job_posting", label: "Job posting" },
  { key: "repo", label: "Repo / work to mimic" },
  { key: "pipeline", label: "Pipeline / research" },
  { key: "paper", label: "Paper" },
  { key: "company_page", label: "Company / lab page" },
  { key: "description", label: "Free description" },
];

export const ARTIFACT_TYPE_LABEL = Object.fromEntries(
  ARTIFACT_TYPES.map((t) => [t.key, t.label])
);

// Depth (section 03) — single-select; reshapes plan content.
export const DEPTH_OPTIONS = [
  {
    key: "landscape",
    label: "Understand the landscape",
    hint: "Orientation, not mastery — one rung up.",
  },
  {
    key: "functional",
    label: "Get hands-on and functional",
    hint: "Climb to working competence.",
  },
  {
    key: "deep",
    label: "Go deep and specialize",
    hint: "Top of the relevant chains.",
  },
];

// Purpose (section 03) — single-select; reshapes plan emphasis.
export const PURPOSE_OPTIONS = [
  {
    key: "starting_role",
    label: "Starting a role soon",
    hint: "Favors the first real task and just-in-time depth.",
  },
  {
    key: "interview",
    label: "Prepping for an interview",
    hint: "Favors breadth and likely-to-be-asked concepts.",
  },
  {
    key: "career_move",
    label: "Exploring a career move",
    hint: "Favors durable foundations.",
  },
  {
    key: "curious",
    label: "Just curious",
    hint: "A fast, low-commitment taste.",
  },
];
