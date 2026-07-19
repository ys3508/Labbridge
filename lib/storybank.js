import { normalizeComparableText, stableFingerprint } from "./textFingerprint.js";

// Storybank data-layer API (Path A, S1-S4)
//
// Main seam for CC's drill/dig UI:
// - bankClaim(input, options): confirmation-gated entry + append-only provenance event.
// - getClaims(scope, options): read banked claims with computed tier and surviving events.
// - attachGrading(eventOrId, grading, options): attach assessment to a plan-stamped event.
// - deletePlan(planId, options): remove plan-stamped events + their grading, cascade zero-event claims.
// - tierOf(claim, options): compute max tier over surviving events; never stored.
//
// Additional deleters required by ADR-0006 debt #4:
// - deleteResume(options): remove resume-lifted null-plan events + cascade claims.
// - eraseClaim(claimId, options): hard-delete one claim and its events/grading.
//
// The module is persistence-backed but pure at the boundary: pass a store returned by
// createStorybankStore() for tests or future backend wiring. Without a store, browser
// localStorage is used when available; otherwise an in-memory store is used.

export const STORYBANK_STORAGE_KEY = "lb_storybank_v1";

export const TIERS = {
  LIFTED: 1,
  OFFERED_BY_DIG: 2,
  SAID_ALOUD: 3,
  SURVIVED_PUSHBACK: 4,
};

export const SOURCES = {
  RESUME: "lifted-from-resume",
  JD: "lifted-from-jd",
  DIG: "offered-by-dig",
  SAID_ALOUD: "said-aloud",
  SURVIVED_PUSHBACK: "survived-pushback",
};

export const STORYBANK_WRITER_DELETERS = [
  { writer: "bankClaim:claim", deleter: "eraseClaim" },
  { writer: "bankClaim:provenanceEvent", deleter: "deletePlan/deleteResume/eraseClaim" },
  { writer: "attachGrading", deleter: "deletePlan/eraseClaim" },
  { writer: "resume seed", deleter: "deleteResume" },
];

function emptyState() {
  return {
    claims: {},
    events: [],
    gradings: {},
    resume: null,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function memoryStorage(initial) {
  let state = clone(initial || emptyState());
  return {
    read: () => clone(state),
    write: (next) => {
      state = clone(next);
      return clone(state);
    },
    clear: () => {
      state = emptyState();
    },
  };
}

function browserStorage(storageKey = STORYBANK_STORAGE_KEY) {
  if (typeof localStorage === "undefined") return null;
  return {
    read: () => {
      try {
        return JSON.parse(localStorage.getItem(storageKey) || "null") || emptyState();
      } catch {
        return emptyState();
      }
    },
    write: (next) => {
      localStorage.setItem(storageKey, JSON.stringify(next));
      return clone(next);
    },
    clear: () => localStorage.removeItem(storageKey),
  };
}

let defaultMemoryStore = null;

export function createStorybankStore(initial) {
  return memoryStorage(initial);
}

function storeFor(options = {}) {
  if (options.store) return options.store;
  const browser = browserStorage(options.storageKey);
  if (browser) return browser;
  if (!defaultMemoryStore) defaultMemoryStore = memoryStorage();
  return defaultMemoryStore;
}

function readState(options) {
  const store = storeFor(options);
  const state = { ...emptyState(), ...(store.read() || {}) };
  state.claims = state.claims || {};
  state.events = Array.isArray(state.events) ? state.events : [];
  state.gradings = state.gradings || {};
  return { store, state };
}

function writeState(store, state) {
  return store.write({
    claims: state.claims || {},
    events: state.events || [],
    gradings: state.gradings || {},
    resume: state.resume || null,
  });
}

function now(options) {
  return options?.timestamp || new Date().toISOString();
}

function claimIdFor(text) {
  return `claim_${stableFingerprint(normalizeComparableText(text))}`;
}

function eventIdFor(event) {
  return `event_${stableFingerprint({
    claim_id: event.claim_id,
    tier: event.tier,
    plan_id: event.plan_id || "",
    source: event.source,
    timestamp: event.timestamp,
  })}`;
}

function normalizeTier(tier, source) {
  if (tier) return Number(tier);
  if (source === SOURCES.OFFERED_BY_DIG) return TIERS.OFFERED_BY_DIG;
  if (source === SOURCES.SAID_ALOUD) return TIERS.SAID_ALOUD;
  if (source === SOURCES.SURVIVED_PUSHBACK) return TIERS.SURVIVED_PUSHBACK;
  return TIERS.LIFTED;
}

function validateEvent({ source, tier, plan_id }) {
  if (!Object.values(SOURCES).includes(source)) throw new Error(`Unknown storybank source: ${source}`);
  if (![1, 2, 3, 4].includes(tier)) throw new Error(`Unknown storybank tier: ${tier}`);
  if (source === SOURCES.RESUME) {
    if (tier !== TIERS.LIFTED) throw new Error("Resume-lifted events must be tier 1.");
    if (plan_id != null) throw new Error("Resume-lifted events must have plan_id null.");
    return;
  }
  if (source === SOURCES.JD && tier !== TIERS.LIFTED) throw new Error("JD-lifted events must be tier 1.");
  if (!plan_id) throw new Error(`${source} events must be plan-stamped.`);
}

function survivingEventsFor(state, claimId) {
  return state.events.filter((event) => event.claim_id === claimId);
}

function withComputedClaim(state, claim) {
  const events = survivingEventsFor(state, claim.id);
  return {
    ...clone(claim),
    tier: events.reduce((max, event) => Math.max(max, event.tier || 0), 0),
    events: clone(events),
  };
}

function cascadeZeroEventClaims(state) {
  const liveClaimIds = new Set(state.events.map((event) => event.claim_id));
  Object.keys(state.claims).forEach((claimId) => {
    if (!liveClaimIds.has(claimId)) delete state.claims[claimId];
  });
}

function purgeGradingsForMissingEvents(state) {
  const liveEventIds = new Set(state.events.map((event) => event.id));
  Object.keys(state.gradings).forEach((eventId) => {
    if (!liveEventIds.has(eventId)) delete state.gradings[eventId];
  });
}

export function bankClaim(input = {}, options = {}) {
  const { store, state } = readState(options);
  const text = normalizeComparableText(input.text || input.claim || "");
  if (!text) throw new Error("Cannot bank an empty claim.");

  const claim_id = input.claim_id || claimIdFor(text);
  const existing = state.claims[claim_id];
  if (!existing && input.confirmed !== true) {
    throw new Error("Storybank entry is confirmation-gated: confirmed=true required for a new claim.");
  }

  const source = input.source || SOURCES.DIG;
  const tier = normalizeTier(input.tier, source);
  const plan_id = source === SOURCES.RESUME ? null : input.plan_id || input.planId || null;
  validateEvent({ source, tier, plan_id });

  if (!existing) {
    state.claims[claim_id] = {
      id: claim_id,
      text,
      evidence: normalizeComparableText(input.evidence || ""),
      createdAt: now(options),
      confirmedAt: now(options),
    };
  } else if (input.evidence) {
    state.claims[claim_id] = {
      ...existing,
      evidence: normalizeComparableText(input.evidence),
      updatedAt: now(options),
    };
  }

  if (source === SOURCES.RESUME && input.resumeText) {
    state.resume = { text: String(input.resumeText), updatedAt: now(options) };
  }

  const event = {
    claim_id,
    tier,
    plan_id,
    source,
    timestamp: now(options),
  };
  event.id = input.event_id || eventIdFor(event);
  state.events = [...state.events, event];

  if (input.grading) {
    if (!event.plan_id) throw new Error("Grading can only attach to a plan-stamped event.");
    state.gradings[event.id] = { event_id: event.id, assessment: clone(input.grading), timestamp: now(options) };
  }

  writeState(store, state);
  return { claim: withComputedClaim(state, state.claims[claim_id]), event: clone(event) };
}

export function getClaims(scope = {}, options = {}) {
  const { state } = readState(options);
  const claims = Object.values(state.claims).map((claim) => withComputedClaim(state, claim));
  return claims
    .filter((claim) => {
      if (scope.claim_id || scope.claimId) return claim.id === (scope.claim_id || scope.claimId);
      if (scope.plan_id || scope.planId) return claim.events.some((event) => event.plan_id === (scope.plan_id || scope.planId));
      if (scope.source) return claim.events.some((event) => event.source === scope.source);
      return true;
    })
    .filter((claim) => claim.tier > 0);
}

export function tierOf(claim, options = {}) {
  if (!claim) return 0;
  if (Array.isArray(claim.events)) {
    return claim.events.reduce((max, event) => Math.max(max, event.tier || 0), 0);
  }
  const id = typeof claim === "string" ? claim : claim.id || claim.claim_id;
  if (!id) return 0;
  const { state } = readState(options);
  return survivingEventsFor(state, id).reduce((max, event) => Math.max(max, event.tier || 0), 0);
}

export function attachGrading(eventOrId, grading = {}, options = {}) {
  const { store, state } = readState(options);
  const eventId = typeof eventOrId === "string" ? eventOrId : eventOrId?.id;
  const event = state.events.find((item) => item.id === eventId);
  if (!event) throw new Error("Cannot attach grading to a missing provenance event.");
  if (!event.plan_id) throw new Error("Grading can only attach to a plan-stamped provenance event.");

  state.gradings[event.id] = {
    event_id: event.id,
    assessment: clone(grading),
    timestamp: now(options),
  };
  writeState(store, state);
  return clone(state.gradings[event.id]);
}

export function getGrading(eventOrId, options = {}) {
  const { state } = readState(options);
  const eventId = typeof eventOrId === "string" ? eventOrId : eventOrId?.id;
  return state.gradings[eventId] ? clone(state.gradings[eventId]) : null;
}

export function deletePlan(planId, options = {}) {
  if (!planId) throw new Error("deletePlan requires a planId.");
  const { store, state } = readState(options);
  const beforeClaimCount = Object.keys(state.claims).length;
  const removedEvents = state.events.filter((event) => event.plan_id === planId);
  const removedEventIds = new Set(removedEvents.map((event) => event.id));

  state.events = state.events.filter((event) => event.plan_id !== planId);
  Object.keys(state.gradings).forEach((eventId) => {
    if (removedEventIds.has(eventId)) delete state.gradings[eventId];
  });
  purgeGradingsForMissingEvents(state);
  cascadeZeroEventClaims(state);
  writeState(store, state);

  return {
    removedEvents: removedEvents.length,
    removedClaims: beforeClaimCount - Object.keys(state.claims).length,
  };
}

export function deleteResume(options = {}) {
  const { store, state } = readState(options);
  const beforeClaimCount = Object.keys(state.claims).length;
  const removedEvents = state.events.filter((event) => event.source === SOURCES.RESUME && event.plan_id == null);

  state.events = state.events.filter((event) => !(event.source === SOURCES.RESUME && event.plan_id == null));
  state.resume = null;
  purgeGradingsForMissingEvents(state);
  cascadeZeroEventClaims(state);
  writeState(store, state);

  return {
    removedEvents: removedEvents.length,
    removedClaims: beforeClaimCount - Object.keys(state.claims).length,
  };
}

export function eraseClaim(claimId, options = {}) {
  if (!claimId) throw new Error("eraseClaim requires a claimId.");
  const { store, state } = readState(options);
  const hadClaim = Boolean(state.claims[claimId]);
  const removedEvents = state.events.filter((event) => event.claim_id === claimId);
  const removedEventIds = new Set(removedEvents.map((event) => event.id));

  state.events = state.events.filter((event) => event.claim_id !== claimId);
  Object.keys(state.gradings).forEach((eventId) => {
    if (removedEventIds.has(eventId)) delete state.gradings[eventId];
  });
  delete state.claims[claimId];
  writeState(store, state);

  return { removedEvents: removedEvents.length, removedClaims: hadClaim ? 1 : 0 };
}

export function storybankState(options = {}) {
  return clone(readState(options).state);
}

export function assertStorybankDeleteCoverage() {
  const missing = STORYBANK_WRITER_DELETERS.filter((entry) => !entry.deleter);
  return { ok: missing.length === 0, missing };
}
