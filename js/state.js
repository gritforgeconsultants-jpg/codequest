/**
 * state.js — localStorage wrapper with dot-path get/set and schema migration.
 * All game progress is stored under a single key: "cq_state"
 */

const STORAGE_KEY = 'cq_state';
const SCHEMA_VERSION = 1;

const DEFAULT_STATE = {
  version: SCHEMA_VERSION,
  totalXP: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: null,
  badgesUnlocked: [],
  settings: {
    judge0ApiKey: '',
    soundEnabled: true,
    theme: 'dark',
  },
  progress: {},   // keyed by challengeId
  lessons: {},    // keyed by lessonId
  tracks: {},     // keyed by trackId
};

let _state = null;

function _load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    // Migrate if needed
    if (parsed.version !== SCHEMA_VERSION) return _migrate(parsed);
    return parsed;
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function _migrate(old) {
  // Future: handle migrations by version number
  return { ...structuredClone(DEFAULT_STATE), ...old, version: SCHEMA_VERSION };
}

function _save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
  } catch (e) {
    console.warn('CodeQuest: could not save state', e);
  }
}

function _ensure() {
  if (!_state) _state = _load();
}

/** Get a value by dot-path. E.g. get('settings.soundEnabled') */
export function get(path) {
  _ensure();
  return path.split('.').reduce((obj, key) => obj?.[key], _state);
}

/** Set a value by dot-path and persist. E.g. set('totalXP', 250) */
export function set(path, value) {
  _ensure();
  const parts = path.split('.');
  let obj = _state;
  for (let i = 0; i < parts.length - 1; i++) {
    if (obj[parts[i]] == null || typeof obj[parts[i]] !== 'object') {
      obj[parts[i]] = {};
    }
    obj = obj[parts[i]];
  }
  obj[parts[parts.length - 1]] = value;
  _save();
}

/** Increment a numeric value by dot-path */
export function inc(path, amount = 1) {
  set(path, (get(path) ?? 0) + amount);
}

/** Push a value to an array at dot-path */
export function push(path, value) {
  const arr = get(path) ?? [];
  if (!arr.includes(value)) {
    set(path, [...arr, value]);
  }
}

/** Get the full state snapshot (read-only intent) */
export function snapshot() {
  _ensure();
  return structuredClone(_state);
}

/** Reset all progress (keep settings) */
export function resetProgress() {
  _ensure();
  const settings = _state.settings;
  _state = { ...structuredClone(DEFAULT_STATE), settings };
  _save();
}

/** Full reset including settings */
export function resetAll() {
  _state = structuredClone(DEFAULT_STATE);
  _save();
}

// ── Convenience helpers ────────────────────────────────────

/** Mark a challenge as completed and record details */
export function completeChallenge(challengeId, { xpAwarded, attempts, hintsUsed, solvedFirstTry }) {
  set(`progress.${challengeId}`, {
    status: 'completed',
    xpAwarded,
    attempts,
    hintsUsed,
    solvedFirstTry,
    completedAt: Date.now(),
  });
}

/** Mark a lesson complete */
export function completeLesson(lessonId, xpAwarded) {
  set(`lessons.${lessonId}`, { status: 'completed', xpAwarded });
}

/** Mark a track started if not already */
export function touchTrack(trackId) {
  if (!get(`tracks.${trackId}`)) {
    set(`tracks.${trackId}`, { status: 'in-progress', lessonsCompleted: 0 });
  }
}

/** Increment a track's completed lesson count */
export function incTrackLessons(trackId) {
  inc(`tracks.${trackId}.lessonsCompleted`);
}

/** Check if a challenge is completed */
export function isChallengeComplete(id) {
  return get(`progress.${id}`)?.status === 'completed';
}

/** Check if a lesson is completed */
export function isLessonComplete(id) {
  return get(`lessons.${id}`)?.status === 'completed';
}
