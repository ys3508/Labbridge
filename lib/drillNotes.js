import { normalizeComparableText, stableFingerprint } from "./textFingerprint.js";

// Drill notes data-layer API (Phase 5)
//
// Main seam for CC's tap-to-notes UI:
// - addNote({ planKey, taskIndex, text, source }, options): write one plan-scoped note.
// - getNotes(planKey, { taskIndex? }, options): read notes in creation order.
// - deleteNote(planKey, id, options): delete one note from a plan.
// - deletePlanNotes(planKey, options): delete every note for a plan.
//
// The caller owns planKey derivation; this module never fingerprints or derives
// a plan identity. It is persistence-backed but store-injectable for zero-API
// tests. Without a store, browser localStorage is used when available; otherwise
// an in-memory store is used.

export const DRILL_NOTES_STORAGE_KEY = "lb_drill_notes_v1";

export const DRILL_NOTE_WRITER_DELETERS = [
  { writer: "addNote", deleter: "deleteNote/deletePlanNotes" },
];

function emptyState() {
  return { notes: [] };
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

function browserStorage(storageKey = DRILL_NOTES_STORAGE_KEY) {
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

export function createDrillNotesStore(initial) {
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
  state.notes = Array.isArray(state.notes) ? state.notes : [];
  return { store, state };
}

function writeState(store, state) {
  return store.write({ notes: state.notes || [] });
}

function now(options) {
  return options?.timestamp || new Date().toISOString();
}

function requirePlanKey(planKey) {
  const value = normalizeComparableText(planKey || "");
  if (!value) throw new Error("Drill notes require a caller-provided planKey.");
  return value;
}

function noteIdFor(note) {
  return `note_${stableFingerprint({
    planKey: note.planKey,
    taskIndex: note.taskIndex,
    text: note.text,
    source: note.source,
    createdAt: note.createdAt,
  })}`;
}

export function addNote(input = {}, options = {}) {
  const { store, state } = readState(options);
  const planKey = requirePlanKey(input.planKey);
  const text = normalizeComparableText(input.text || "");
  if (!text) throw new Error("Cannot add an empty drill note.");

  const taskIndex = Number.isFinite(Number(input.taskIndex)) ? Number(input.taskIndex) : null;
  const createdAt = now(options);
  const note = {
    planKey,
    taskIndex,
    text,
    source: normalizeComparableText(input.source || "tap-to-notes"),
    createdAt,
  };
  note.id = input.id || noteIdFor(note);

  state.notes = [...state.notes, note];
  writeState(store, state);
  return clone(note);
}

export function getNotes(planKey, filters = {}, options = {}) {
  const key = requirePlanKey(planKey);
  const { state } = readState(options);
  const hasTaskFilter = filters && Object.prototype.hasOwnProperty.call(filters, "taskIndex");
  return state.notes
    .filter((note) => note.planKey === key)
    .filter((note) => !hasTaskFilter || note.taskIndex === Number(filters.taskIndex))
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
    .map(clone);
}

export function deleteNote(planKey, id, options = {}) {
  const key = requirePlanKey(planKey);
  if (!id) throw new Error("deleteNote requires an id.");
  const { store, state } = readState(options);
  const before = state.notes.length;
  state.notes = state.notes.filter((note) => !(note.planKey === key && note.id === id));
  writeState(store, state);
  return { removedNotes: before - state.notes.length };
}

export function deletePlanNotes(planKey, options = {}) {
  const key = requirePlanKey(planKey);
  const { store, state } = readState(options);
  const before = state.notes.length;
  state.notes = state.notes.filter((note) => note.planKey !== key);
  writeState(store, state);
  return { removedNotes: before - state.notes.length };
}

export function drillNotesState(options = {}) {
  return clone(readState(options).state);
}

export function assertDrillNotesDeleteCoverage() {
  const missing = DRILL_NOTE_WRITER_DELETERS.filter((entry) => !entry.deleter);
  return { ok: missing.length === 0, missing };
}
