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
