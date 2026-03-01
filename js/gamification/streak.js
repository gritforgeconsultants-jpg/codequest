import * as state from '../state.js';
import { todayStr, yesterdayStr } from '../utils/fmt.js';

/** Get current streak count */
export function get() {
  return state.get('currentStreak') ?? 0;
}

/** Record activity for today; updates streak and returns new streak count */
export function recordActivity() {
  const today     = todayStr();
  const last      = state.get('lastActivityDate');
  const yesterday = yesterdayStr();

  if (last === today) {
    // Already counted today
    return state.get('currentStreak') ?? 0;
  }

  let newStreak;
  if (last === yesterday) {
    // Consecutive day
    newStreak = (state.get('currentStreak') ?? 0) + 1;
  } else {
    // Streak broken or first time
    newStreak = 1;
  }

  state.set('currentStreak', newStreak);
  state.set('lastActivityDate', today);
  state.set('longestStreak', Math.max(
    state.get('longestStreak') ?? 0,
    newStreak
  ));

  return newStreak;
}

/** True if the user has a streak going (activity today or yesterday) */
export function isActive() {
  const last = state.get('lastActivityDate');
  return last === todayStr() || last === yesterdayStr();
}
