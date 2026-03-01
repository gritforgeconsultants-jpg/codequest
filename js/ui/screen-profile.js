import { ce, render } from '../utils/dom.js';
import { fmtXP, fmtN } from '../utils/fmt.js';
import * as state from '../state.js';
import * as xpMod from '../gamification/xp.js';
import { get as getStreak } from '../gamification/streak.js';
import { BADGES, unlocked } from '../gamification/badges.js';
import { allTracks, lessonsForTrack } from '../curriculum.js';

function goBack() {
  if (window.history.length > 1) window.history.back();
  else window.location.hash = 'home';
}

export function renderProfile(appEl) {
  const totalXP = state.get('totalXP') ?? 0;
  const { level, title, xpForLevel, xpForNext } = xpMod.getLevelInfo(totalXP);
  const progress = xpMod.getLevelProgress(totalXP);
  const streak   = getStreak();
  const longest  = state.get('longestStreak') ?? 0;
  const unlockedIds = unlocked();

  // XP / Level card
  const xpCard = ce('div', { class: 'stat-card' },
    ce('div', { style: 'text-align:center;padding:8px 0' },
      ce('div', { style: 'font-size:48px;font-weight:900;color:var(--accent)' }, `Lv ${level}`),
      ce('div', { style: 'font-size:18px;font-weight:700;margin:4px 0' }, title),
      ce('div', { style: 'color:var(--text-dim);font-size:13px' }, `${fmtXP(totalXP)} total XP`),
    ),
    ce('div', { class: 'progress-bar', style: 'margin-top:12px' },
      ce('div', { class: 'progress-bar-fill', style: `width:${Math.round(progress * 100)}%` }),
    ),
    ce('div', { class: 'progress-label' },
      ce('span', { text: `${fmtXP(totalXP - xpForLevel)} XP in level` }),
      ce('span', { text: `${fmtXP(xpForNext - xpForLevel)} XP needed` }),
    ),
  );

  // Streak card
  const streakCard = ce('div', { class: 'stat-card', style: 'display:flex;gap:24px;justify-content:center' },
    stat('🔥', streak, 'Current Streak'),
    stat('🏆', longest, 'Best Streak'),
    stat('⚡', Object.values(state.get('progress') ?? {}).filter(p => p.status === 'completed').length, 'Challenges Done'),
  );

  // Track progress
  const trackRows = allTracks().map(track => {
    const lessons  = lessonsForTrack(track.id);
    const done     = lessons.filter(l => state.isLessonComplete(l.id)).length;
    const pct      = lessons.length ? done / lessons.length : 0;
    return ce('div', { style: 'margin-bottom:12px' },
      ce('div', { style: 'display:flex;justify-content:space-between;margin-bottom:4px' },
        ce('span', { text: `${track.icon} ${track.title}` }),
        ce('span', { style: 'color:var(--text-dim);font-size:13px', text: `${done}/${lessons.length}` }),
      ),
      ce('div', { class: 'progress-bar' },
        ce('div', { class: `progress-bar-fill${done === lessons.length && lessons.length > 0 ? ' success' : ''}`,
                    style: `width:${Math.round(pct * 100)}%` }),
      ),
    );
  });

  // Badges
  const badgeEls = BADGES.map(badge => {
    const isUnlocked = unlockedIds.includes(badge.id);
    return ce('div', { class: `badge-item ${isUnlocked ? 'unlocked' : 'locked'}`, title: badge.desc },
      ce('div', { class: 'badge-icon', text: badge.icon }),
      ce('div', { class: 'badge-title', text: badge.title }),
    );
  });

  const header = ce('header', { class: 'app-header' },
    ce('button', { class: 'back-btn', onclick: goBack }, '‹ Back'),
    ce('h1', { text: 'Profile' }),
  );

  render(appEl,
    header,
    ce('div', { class: 'screen' },
      ce('div', { class: 'screen-content' },
        xpCard,
        streakCard,
        ce('div', { class: 'section-label', text: 'Track Progress' }),
        ce('div', { class: 'stat-card' }, ...trackRows),
        ce('div', { class: 'section-label', text: `Badges (${unlockedIds.length}/${BADGES.length})` }),
        ce('div', { class: 'badge-grid' }, ...badgeEls),
      ),
    ),
  );
}

function stat(icon, value, label) {
  return ce('div', { style: 'text-align:center' },
    ce('div', { style: 'font-size:24px' }, icon),
    ce('div', { style: 'font-size:22px;font-weight:800' }, String(value)),
    ce('div', { style: 'font-size:11px;color:var(--text-muted)' }, label),
  );
}
