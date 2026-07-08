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

// Comprehensive field/major pool for the type-ahead. The curated chips above
// are what we show BEFORE the user types; this is what we MATCH against once
// they start typing, so "data" surfaces Data Science, Data Analytics, Data
// Engineering, Database Administration, etc. Free-type is still allowed — this
// only makes the common cases a tap instead of a full type-out.
export const FIELD_POOL = [
  // Computing & data
  "Computer Science", "Software Engineering", "Data Science", "Data Analytics",
  "Data Engineering", "Database Administration", "Information Technology",
  "Information Systems", "Management Information Systems", "Business Analytics",
  "Cybersecurity", "Artificial Intelligence", "Machine Learning",
  "Web Development", "Mobile Development", "Cloud Computing", "DevOps",
  "Computer Engineering", "Human-Computer Interaction", "Game Design",
  "Network Engineering", "Data Journalism",
  // Engineering
  "Mechanical Engineering", "Electrical Engineering", "Civil Engineering",
  "Chemical Engineering", "Aerospace Engineering", "Biomedical Engineering",
  "Industrial Engineering", "Environmental Engineering", "Materials Engineering",
  "Nuclear Engineering", "Petroleum Engineering", "Structural Engineering",
  "Systems Engineering", "Robotics", "Mechatronics", "Engineering Management",
  // Physical & earth sciences
  "Physics", "Astrophysics", "Astronomy", "Chemistry", "Geology",
  "Earth Science", "Environmental Science", "Oceanography", "Meteorology",
  "Materials Science", "Sustainability",
  // Life sciences
  "Biology", "Molecular Biology", "Cell Biology", "Biochemistry", "Genetics",
  "Genomics", "Microbiology", "Neuroscience", "Ecology", "Botany", "Zoology",
  "Marine Biology", "Bioinformatics", "Biotechnology", "Immunology",
  "Physiology", "Pharmacology", "Food Science", "Agriculture", "Forestry",
  // Math & quant
  "Mathematics", "Applied Mathematics", "Statistics", "Biostatistics",
  "Actuarial Science", "Operations Research", "Quantitative Finance",
  // Health & medicine
  "Medicine", "Nursing", "Public Health", "Epidemiology", "Health Administration",
  "Pharmacy", "Dentistry", "Physical Therapy", "Occupational Therapy",
  "Nutrition", "Dietetics", "Veterinary Medicine", "Optometry", "Radiology",
  "Kinesiology", "Speech-Language Pathology", "Midwifery", "Paramedicine",
  "Clinical Psychology", "Mental Health Counseling",
  // Business
  "Business Administration", "Finance", "Accounting", "Economics", "Marketing",
  "Digital Marketing", "Management", "Entrepreneurship", "Human Resources",
  "Supply Chain Management", "Operations Management", "Logistics",
  "International Business", "Real Estate", "Investment Banking", "Sales",
  "Project Management", "Product Management", "Hospitality Management",
  // Social sciences
  "Psychology", "Sociology", "Anthropology", "Political Science",
  "International Relations", "Geography", "Criminology", "Criminal Justice",
  "Social Work", "Public Policy", "Public Administration", "Urban Planning",
  // Law
  "Law", "Legal Studies", "Paralegal Studies", "Corporate Law",
  // Humanities & languages
  "History", "Philosophy", "English", "Literature", "Linguistics",
  "Creative Writing", "Religious Studies", "Classics", "Translation",
  // Arts, design & media
  "Graphic Design", "UX Design", "Product Design", "Industrial Design",
  "Interior Design", "Fashion Design", "Fine Arts", "Illustration",
  "Animation", "Architecture", "Photography", "Film", "Music", "Theater",
  "Communications", "Journalism", "Public Relations", "Advertising",
  "Media Studies", "User Research",
  // Education & other
  "Education", "Early Childhood Education", "Special Education",
  "Library Science", "Culinary Arts", "Construction Management", "Aviation",
];

// Comprehensive pool of common job titles/roles for the Target-role type-ahead
// (section 02). Free-type is still allowed; this makes the common cases a tap.
export const ROLE_POOL = [
  // Software & data
  "Software Engineer", "Frontend Engineer", "Backend Engineer",
  "Full Stack Engineer", "Mobile Developer", "Web Developer",
  "Data Scientist", "Data Analyst", "Data Engineer",
  "Machine Learning Engineer", "AI Researcher", "Research Scientist",
  "DevOps Engineer", "Site Reliability Engineer", "Security Engineer",
  "QA Engineer", "Cloud Architect", "Solutions Architect",
  "Product Manager", "Technical Program Manager", "Engineering Manager",
  "Database Administrator", "Systems Administrator", "Network Engineer",
  "Business Intelligence Analyst", "Computational Biologist",
  "Bioinformatics Scientist", "Data Journalist",
  // Design & UX
  "Product Designer", "UX Designer", "UI Designer", "UX Researcher",
  "Graphic Designer", "Industrial Designer", "Art Director", "Design Manager",
  // Business, finance & ops
  "Financial Analyst", "Investment Banker", "Investment Analyst",
  "Portfolio Manager", "Accountant", "Auditor", "Controller",
  "Management Consultant", "Business Analyst", "Operations Manager",
  "Project Manager", "Program Manager", "Product Marketing Manager",
  "Marketing Manager", "Brand Manager", "Growth Marketer",
  "Digital Marketer", "Content Strategist", "SEO Specialist",
  "Sales Representative", "Account Executive", "Account Manager",
  "Business Development Manager", "Human Resources Manager", "Recruiter",
  "Supply Chain Manager", "Logistics Coordinator", "Financial Advisor",
  // Health & sciences
  "Registered Nurse", "Nurse Practitioner", "Physician", "Physician Assistant",
  "Pharmacist", "Physical Therapist", "Clinical Research Coordinator",
  "Medical Scientist", "Epidemiologist", "Public Health Analyst",
  "Biostatistician", "Lab Technician", "Postdoctoral Researcher",
  // Legal, policy & education
  "Attorney", "Corporate Lawyer", "Paralegal", "Legal Counsel",
  "Compliance Officer", "Policy Analyst", "Urban Planner", "Teacher",
  "Professor", "Instructional Designer",
  // Writing, media & other engineering
  "Technical Writer", "Content Writer", "Copywriter", "Editor",
  "Video Editor", "Animator", "Journalist",
  "Mechanical Engineer", "Electrical Engineer", "Civil Engineer",
  "Chemical Engineer", "Aerospace Engineer", "Biomedical Engineer",
  "Industrial Engineer",
];

// Acronyms that are NOT just the first-letters of the words (those match for
// free). Keyed by the lowercased letters the user types.
export const ROLE_ALIASES = {
  swe: ["Software Engineer"],
  sde: ["Software Engineer"],
  ic: ["Software Engineer"],
  pm: ["Product Manager", "Project Manager", "Program Manager"],
  tpm: ["Technical Program Manager"],
  ux: ["UX Designer", "UX Researcher"],
  ui: ["UI Designer"],
  ib: ["Investment Banker"],
  hr: ["Human Resources Manager"],
  np: ["Nurse Practitioner"],
  pa: ["Physician Assistant"],
  rn: ["Registered Nurse"],
};

export const FIELD_ALIASES = {
  cs: ["Computer Science"],
  ml: ["Machine Learning"],
  ai: ["Artificial Intelligence"],
  ee: ["Electrical Engineering"],
  me: ["Mechanical Engineering"],
  ir: ["International Relations"],
  hci: ["Human-Computer Interaction"],
  poli: ["Political Science"],
};

// Type-ahead matcher shared by Field-of-study and Target-role. Ranks:
// 0 prefix match, 1 initials/acronym match, 3 substring match.
export function poolMatches(pool, query, { exclude = [], aliases = {}, limit = 8 } = {}) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];
  const qLetters = q.replace(/[^a-z0-9]/g, "");
  const excl = new Set(exclude);
  const scored = [];
  for (const item of pool) {
    if (excl.has(item)) continue;
    const lower = item.toLowerCase();
    const initials = item
      .split(/[\s/&-]+/)
      .filter(Boolean)
      .map((w) => w[0].toLowerCase())
      .join("");
    let score = null;
    if (lower.startsWith(q)) score = 0;
    else if (qLetters.length >= 2 && initials.startsWith(qLetters)) score = 1;
    else if (aliases[qLetters] && aliases[qLetters].includes(item)) score = 1;
    else if (lower.includes(q)) score = 3;
    if (score !== null) scored.push([score, item]);
  }
  scored.sort((a, b) => a[0] - b[0] || a[1].length - b[1].length);
  return scored.slice(0, limit).map((s) => s[1]);
}

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
