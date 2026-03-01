import { ce, render, qs } from '../utils/dom.js';
import { getChallenge, challengesForLesson, getLesson } from '../curriculum.js';
import * as state from '../state.js';
import * as xpMod from '../gamification/xp.js';
import * as streak from '../gamification/streak.js';
import * as badges from '../gamification/badges.js';
import * as toast from './toast.js';
import { renderMCQ }      from '../challenges/multiple-choice.js';
import { renderFillBlank } from '../challenges/fill-blank.js';
import { renderFreeCode }  from '../challenges/free-code.js';
import { renderFixBug }    from '../challenges/fix-bug.js';

export function renderChallenge(appEl, challengeId) {
  const ch = getChallenge(challengeId);
  if (!ch) { window.location.hash = 'home'; return; }

  const lesson     = getLesson(ch.lessonId);
  const challenges = challengesForLesson(ch.lessonId);
  const chIndex    = challenges.findIndex(c => c.id === challengeId);
  const totalSteps = (lesson?.theory?.sections?.length ?? 0) + challenges.length;
  const stepIdx    = (lesson?.theory?.sections?.length ?? 0) + chIndex;
  const pct        = ((stepIdx + 1) / totalSteps) * 100;

  // Track attempts, hints, start time
  let attempts    = 0;
  let hintsUsed   = 0;
  let startTime   = Date.now();

  function onHint() { hintsUsed++; }

  function onComplete(correct) {
    if (!correct) return;
    attempts++;

    const solvedFirstTry = attempts === 1 && hintsUsed === 0;
    const solveTimeMs    = Date.now() - startTime;

    // XP
    let rawXP = ch.xpReward ?? 15;
    if (solvedFirstTry) rawXP += 5;
    const { awarded, totalXP, leveledUp, newLevel } = xpMod.award(rawXP);

    // Streak
    const newStreak = streak.recordActivity();

    // Save progress
    state.completeChallenge(ch.id, { xpAwarded: awarded, attempts, hintsUsed, solvedFirstTry });
    state.inc('totalXP', 0); // no-op, already set

    // Badges
    const newBadges = badges.check(badges.buildCtx({ solveTimeMs }));
    newBadges.forEach(id => {
      const badge = badges.BADGES.find(b => b.id === id);
      if (badge) setTimeout(() => toast.badgeUnlock(badge), 1500);
    });

    // Level up
    if (leveledUp) {
      const { title } = xpMod.getLevelInfo(totalXP);
      setTimeout(() => toast.levelUp(newLevel, title), 500);
    }

    // Determine next challenge or lesson completion
    const nextCh = challenges[chIndex + 1];

    // Check if all challenges in lesson are done
    const allDone = challenges.every(c => state.isChallengeComplete(c.id));
    if (allDone && !state.isLessonComplete(ch.lessonId)) {
      state.completeLesson(ch.lessonId, lesson?.xpReward ?? 50);
      const { awarded: lessonXP } = xpMod.award(lesson?.xpReward ?? 50, false);
      showSuccess(appEl, awarded, { lessonComplete: true, lessonXP, nextCh, lesson });
    } else {
      showSuccess(appEl, awarded, { lessonComplete: false, nextCh, lesson });
    }
  }

  function onAttempt() { attempts++; }

  // Render challenge type
  const progressFill = ce('div', { class: 'lesson-progress-bar-fill', style: `width:${pct}%` });
  const progressBar  = ce('div', { class: 'lesson-progress-bar' }, progressFill);

  const header = ce('header', { class: 'app-header', style: 'position:relative' },
    ce('button', { class: 'back-btn', onclick: () => { window.location.hash = `lesson/${ch.lessonId}`; } }, '‹'),
    ce('h1', { text: lesson?.title ?? 'Challenge' }),
    ce('span', { style: 'color:var(--text-dim);font-size:13px', text: `${chIndex + 1}/${challenges.length}` }),
    progressBar,
  );

  const bodyEl = ce('div', { class: 'screen' });

  render(appEl, header, bodyEl);

  // Mount the correct challenge renderer
  const ctx = { ch, onComplete, onAttempt, onHint };
  switch (ch.type) {
    case 'multiple-choice': renderMCQ(bodyEl, ctx);      break;
    case 'fill-blank':      renderFillBlank(bodyEl, ctx); break;
    case 'free-code':       renderFreeCode(bodyEl, ctx);  break;
    case 'fix-bug':         renderFixBug(bodyEl, ctx);    break;
    default:
      bodyEl.append(ce('div', { class: 'screen-content', text: `Unknown challenge type: ${ch.type}` }));
  }
}

/* ── Success overlay ─────────────────────────────────────── */
function showSuccess(appEl, awardedXP, { lessonComplete, lessonXP, nextCh, lesson }) {
  toast.correct();

  const xpRows = [
    ce('div', { class: 'xp-award-row', text: `+${awardedXP} XP` }),
  ];
  if (lessonComplete) {
    xpRows.push(ce('div', { class: 'xp-award-row bonus', text: `🎓 Lesson complete! +${lessonXP} XP` }));
  }

  const continueLabel = nextCh ? 'Next Challenge →' : (lessonComplete ? 'Back to Track →' : 'Continue →');
  const continueRoute = nextCh
    ? `challenge/${nextCh.id}`
    : `track/${lesson?.trackId ?? 'home'}`;

  const overlay = ce('div', { class: 'success-overlay', onclick: (e) => {
    if (e.target === overlay) dismiss();
  }},
    ce('div', { class: 'success-sheet' },
      ce('div', { class: 'success-icon', text: lessonComplete ? '🏅' : '✅' }),
      ce('div', { class: 'success-title', text: lessonComplete ? 'Lesson Complete!' : 'Correct!' }),
      ce('div', { class: 'xp-award-display' }, ...xpRows),
      ce('button', { class: 'btn btn-primary', onclick: () => { window.location.hash = continueRoute; dismiss(); } }, continueLabel),
    ),
  );

  document.body.append(overlay);

  // XP pop near top of screen
  setTimeout(() => toast.xpPop(awardedXP, overlay.querySelector('.success-sheet')), 200);

  function dismiss() { overlay.remove(); }
}
