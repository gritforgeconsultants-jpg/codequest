import * as state from '../state.js';
import { getLevelInfo } from './xp.js';

export const BADGES = [
  { id: 'first-correct',  icon: '⚡', title: 'First Blood',     desc: 'Answer your first challenge correctly.' },
  { id: 'streak-3',       icon: '🔥', title: 'On a Roll',       desc: 'Maintain a 3-day streak.' },
  { id: 'streak-7',       icon: '🏆', title: 'Week Warrior',    desc: 'Maintain a 7-day streak.' },
  { id: 'no-hints',       icon: '👁️', title: 'No Peeking',      desc: 'Complete 5 challenges without using hints.' },
  { id: 'level-5',        icon: '⭐', title: 'Level 5',         desc: 'Reach level 5.' },
  { id: 'level-10',       icon: '🌟', title: 'Master Coder',    desc: 'Reach level 10.' },
  { id: 'py-complete',    icon: '🐍', title: 'Python Graduate', desc: 'Complete all Python lessons.' },
  { id: 'js-complete',    icon: '⚡', title: 'JS Graduate',     desc: 'Complete all JavaScript lessons.' },
  { id: 'java-complete',  icon: '☕', title: 'Java Graduate',   desc: 'Complete all Java lessons.' },
  { id: 'html-complete',  icon: '🌐', title: 'HTML Graduate',   desc: 'Complete all HTML lessons.' },
  { id: 'css-complete',   icon: '🎨', title: 'CSS Graduate',    desc: 'Complete all CSS lessons.' },
  { id: 'all-tracks',     icon: '🌍', title: 'Polyglot',        desc: 'Start all 5 language tracks.' },
  { id: 'speed-demon',    icon: '💨', title: 'Speed Demon',     desc: 'Solve a challenge in under 30 seconds.' },
];

/** Get list of unlocked badge IDs */
export function unlocked() {
  return state.get('badgesUnlocked') ?? [];
}

/** Unlock a badge by id; returns true if newly unlocked */
function unlock(id) {
  const list = state.get('badgesUnlocked') ?? [];
  if (list.includes(id)) return false;
  state.push('badgesUnlocked', id);
  return true;
}

/**
 * Check all badge conditions and unlock any newly earned.
 * Returns array of newly unlocked badge ids.
 *
 * @param {object} ctx - { totalXP, streak, challengesDone, lessonsCompletedByTrack, solvedFirstTry, solveTimeMs }
 */
export function check(ctx) {
  const {
    totalXP = 0,
    streak = 0,
    challengesDone = 0,
    lessonsCompletedByTrack = {},
    hintlessCount = 0,
    solveTimeMs = null,
    tracksStarted = 0,
  } = ctx;

  const newly = [];

  const tryUnlock = (id) => { if (unlock(id)) newly.push(id); };

  if (challengesDone >= 1)              tryUnlock('first-correct');
  if (streak >= 3)                      tryUnlock('streak-3');
  if (streak >= 7)                      tryUnlock('streak-7');
  if (hintlessCount >= 5)              tryUnlock('no-hints');
  if (getLevelInfo(totalXP).level >= 5) tryUnlock('level-5');
  if (getLevelInfo(totalXP).level >= 10)tryUnlock('level-10');
  if (solveTimeMs !== null && solveTimeMs < 30_000) tryUnlock('speed-demon');

  // Track completion badges
  if ((lessonsCompletedByTrack['python'] ?? 0) >= 8)      tryUnlock('py-complete');
  if ((lessonsCompletedByTrack['javascript'] ?? 0) >= 8)  tryUnlock('js-complete');
  if ((lessonsCompletedByTrack['java'] ?? 0) >= 8)        tryUnlock('java-complete');
  if ((lessonsCompletedByTrack['html'] ?? 0) >= 8)        tryUnlock('html-complete');
  if ((lessonsCompletedByTrack['css'] ?? 0) >= 8)         tryUnlock('css-complete');
  if (tracksStarted >= 5)                                  tryUnlock('all-tracks');

  return newly;
}

/** Build a context object from current state for check() */
export function buildCtx(extras = {}) {
  const s = state.snapshot();
  const totalXP     = s.totalXP ?? 0;
  const streak      = s.currentStreak ?? 0;
  const progress    = s.progress ?? {};
  const tracks      = s.tracks ?? {};
  const lessons     = s.lessons ?? {};

  const challengesDone = Object.values(progress).filter(p => p.status === 'completed').length;
  const hintlessCount  = Object.values(progress).filter(p => p.status === 'completed' && !p.hintsUsed).length;
  const tracksStarted  = Object.keys(tracks).length;

  // Count completed lessons by track
  const lessonsCompletedByTrack = {};
  for (const [lessonId, data] of Object.entries(lessons)) {
    if (data.status !== 'completed') continue;
    const trackId = lessonId.split('-')[0]; // e.g. "py-01-variables" → "py"
    lessonsCompletedByTrack[trackId] = (lessonsCompletedByTrack[trackId] ?? 0) + 1;
  }

  return { totalXP, streak, challengesDone, hintlessCount, tracksStarted, lessonsCompletedByTrack, ...extras };
}
