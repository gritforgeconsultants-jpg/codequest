import { ce, render, qs } from '../utils/dom.js';
import { fmtXP, fmtN } from '../utils/fmt.js';
import { allTracks, lessonsForTrack } from '../curriculum.js';
import * as state from '../state.js';
import * as xpMod from '../gamification/xp.js';
import { get as getStreak, isActive as streakActive } from '../gamification/streak.js';

export function renderHome(appEl) {
  const totalXP    = state.get('totalXP') ?? 0;
  const { level, title, xpForLevel, xpForNext } = xpMod.getLevelInfo(totalXP);
  const progress   = xpMod.getLevelProgress(totalXP);
  const xpToNext   = xpForNext - totalXP;
  const streak     = getStreak();
  const active     = streakActive();

  const streakCard = ce('div', { class: 'stat-card' },
    ce('div', { class: 'stat-card-header' },
      ce('div', {
        class: `streak-badge ${active ? 'active' : 'inactive'}`,
        text: active ? ` ${streak}-day streak!` : ' No streak',
      }),
      ce('div', { class: 'level-info' },
        ce('div', { class: 'level-title', text: `Level ${level} · ${title}` }),
        ce('div', { style: 'font-size:12px;color:var(--text-muted)', text: `${fmtXP(xpToNext)} XP to next level` }),
      ),
    ),
    ce('div', { class: 'progress-bar', style: 'margin-top:8px' },
      ce('div', { class: 'progress-bar-fill', style: `width:${Math.round(progress * 100)}%` }),
    ),
    ce('div', { class: 'progress-label' },
      ce('span', { text: `${fmtXP(totalXP)} XP total` }),
      ce('span', { text: `${Math.round(progress * 100)}%` }),
    ),
  );

  const trackCards = allTracks().map(track => {
    const lessons        = lessonsForTrack(track.id);
    const totalLessons   = lessons.length;
    const doneLessons    = lessons.filter(l => state.isLessonComplete(l.id)).length;
    const pct            = totalLessons ? doneLessons / totalLessons : 0;
    const complete       = doneLessons === totalLessons && totalLessons > 0;

    const card = ce('div', { class: 'track-card', role: 'button', tabindex: '0' },
      ce('div', { class: 'track-icon', text: track.icon }),
      ce('div', { class: 'track-info' },
        ce('div', { class: 'track-title', text: track.title }),
        ce('div', { class: 'track-subtitle', text: track.subtitle }),
        ce('div', { class: 'progress-bar' },
          ce('div', {
            class: `progress-bar-fill${complete ? ' success' : ''}`,
            style: `width:${Math.round(pct * 100)}%`,
          }),
        ),
        ce('div', { class: 'progress-label' },
          ce('span', { text: complete ? '✓ Complete' : fmtN(doneLessons, 'lesson') }),
          ce('span', { text: `${totalLessons}` }),
        ),
      ),
      ce('span', { class: 'chevron', text: '›' }),
    );

    card.addEventListener('click', () => {
      window.location.hash = `track/${track.id}`;
    });

    return card;
  });

  const header = ce('header', { class: 'app-header' },
    ce('h1', { text: 'CodeQuest' }),
    ce('div', { class: 'header-actions' },
      ce('button', { class: 'icon-btn', title: 'Profile', onclick: () => { window.location.hash = 'profile'; } }, '👤'),
      ce('button', { class: 'icon-btn', title: 'Settings', onclick: () => { window.location.hash = 'settings'; } }, '⚙️'),
    ),
  );

  const content = ce('div', { class: 'screen' },
    ce('div', { class: 'screen-content' },
      streakCard,
      ce('div', { class: 'section-label', text: 'Tracks' }),
      ...trackCards,
    ),
  );

  render(appEl, header, content);
}
