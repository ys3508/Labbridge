// SCHEMA notes: the API's structured-output grammar requires every object to be
// strict (additionalProperties:false, fully enumerated) AND rejects large
// compiled grammars — our rich nested schema hit that wall. So generation uses a
// FLAT shape (strings + string-arrays are grammar-cheap; nested objects are
// not), and toRichPlan() in app/api/plan/route.js adapts it to the nested shape
// the app consumes. See ADR-0001 (decisions/ADR-0001-one-flat-generation-schema.md):
// this is the ONE schema shared by every purpose — purposes reinterpret these
// fields, they never add their own. Extracted from app/api/plan/route.js so
// lib/moduleCheck.js's one-schema rule can check fixtures against the real
// shape instead of a hand-copied duplicate that could drift.
const S = { type: "string" };
const I = { type: "integer" };
const ARR = { type: "array", items: { type: "string" } };

export const MODULE = {
  type: "object",
  additionalProperties: false,
  properties: {
    topic: S, archetype: S, closesGapIndex: I, why: S, context: S, bridgeFromBackground: S,
    askYourTeam: ARR, searchLinks: ARR,
    checkQuestion: S, checkOptions: ARR, checkAnswerIndex: I, checkExplanation: S,
    conceptExplanation: S, keyTerms: ARR, traps: ARR,
    exampleSetup: S, exampleWalkThrough: ARR, exampleTakeaway: S,
    taskTitle: S, managerRequest: S, givenInputs: ARR, steps: ARR,
    deliverable: S, timebox: S, timeEstimateMin: I, doneWhen: S, stakeholders: S,
    selfCheckCriteria: ARR, redFlags: ARR,
  },
  required: ["topic","archetype","closesGapIndex","why","context","bridgeFromBackground","askYourTeam","searchLinks","checkQuestion","checkOptions","checkAnswerIndex","checkExplanation","conceptExplanation","keyTerms","traps","exampleSetup","exampleWalkThrough","exampleTakeaway","taskTitle","managerRequest","givenInputs","steps","deliverable","timebox","timeEstimateMin","doneWhen","stakeholders","selfCheckCriteria","redFlags"],
};

export const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    entitySheet: S, trims: ARR,
    hook: S, northStar: S,
    transferableStrengths: ARR, knowledgeGaps: ARR,
    learningSequence: { type: "array", items: MODULE },
    readinessTitle: S, readinessWhy: S, horizon: S,
    horizonAssumed: { type: "boolean" }, phases: ARR, timelineNote: S,
  },
  required: ["entitySheet","trims","hook","northStar","transferableStrengths","knowledgeGaps","learningSequence","readinessTitle","readinessWhy","horizon","horizonAssumed","phases","timelineNote"],
};
