import * as state from '../state.js';
import { get as getStreak } from './streak.js';

const LEVELS = [
  { level: 1,  xp: 0,     title: 'Beginner' },
  { level: 2,  xp: 100,   title: 'Learner' },
  { level: 3,  xp: 250,   title: 'Coder' },
  { level: 4,  xp: 500,   title: 'Developer' },
  { level: 5,  xp: 900,   title: 'Programmer' },
  { level: 6,  xp: 1400,  title: 'Engineer' },
  { level: 7,  xp: 2100,  title: 'Craftsman' },
  { level: 8,  xp: 3000,  title: 'Architect' },
  { level: 9,  xp: 4200,  title: 'Expert' },
  { level: 10, xp: 6000,  title: 'Master' },
];

function getLevelAfter10(xp) {
  // Every 2000 XP after 6000 = +1 level
  return 10 + Math.floor((xp - 6000) / 2000);
}

export function getLevelInfo(totalXP) {
  if (totalXP >= 6000) {
    const level = getLevelAfter10(totalXP);
    const base  = 6000 + (level - 10) * 2000;
    const next  = base + 2000;
    return { level, title: `Master ${level - 9}`, xpForLevel: base, xpForNext: next };
  }
  let current = LEVELS[0];
  for (let i = 1; i < LEVELS.length; i++) {
    if (totalXP < LEVELS[i].xp) break;
    current = LEVELS[i];
  }
  const nextLevel = LEVELS[LEVELS.indexOf(current) + 1];
  return {
    level:      current.level,
    title:      current.title,
    xpForLevel: current.xp,
    xpForNext:  nextLevel?.xp ?? current.xp,
  };
}

export function getLevelProgress(totalXP) {
  const { xpForLevel, xpForNext } = getLevelInfo(totalXP);
  if (xpForNext === xpForLevel) return 1;
  return (totalXP - xpForLevel) / (xpForNext - xpForLevel);
}

/** Apply streak multiplier to raw XP */
function applyStreak(rawXP) {
  const streak = getStreak();
  if (streak >= 7) return Math.round(rawXP * 1.2);
  if (streak >= 3) return Math.round(rawXP * 1.1);
  return rawXP;
}

/**
 * Award XP to the player.
 * Returns { awarded, totalXP, oldLevel, newLevel, leveledUp }
 */
export function award(rawXP, applyStreakBonus = true) {
  const before    = state.get('totalXP') ?? 0;
  const oldLevel  = getLevelInfo(before).level;
  const finalXP   = applyStreakBonus ? applyStreak(rawXP) : rawXP;
  const after     = before + finalXP;

  state.set('totalXP', after);
  const newLevel = getLevelInfo(after).level;

  return {
    awarded: finalXP,
    totalXP: after,
    oldLevel,
    newLevel,
    leveledUp: newLevel > oldLevel,
  };
}
