import { ce, render } from '../utils/dom.js';
import { fmtN, fmtXP } from '../utils/fmt.js';
import { getTrack, lessonsForTrack, getLesson, challengesForLesson } from '../curriculum.js';
import * as state from '../state.js';

function goBack() {
  if (window.history.length > 1) window.history.back();
  else window.location.hash = 'home';
}

/* ── Track screen (lesson map) ───────────────────────────── */
export function renderTrack(appEl, trackId) {
  const track   = getTrack(trackId);
  if (!track) { window.location.hash = 'home'; return; }

  const lessons      = lessonsForTrack(trackId);
  const doneLessons  = lessons.filter(l => state.isLessonComplete(l.id));
  const pct          = lessons.length ? doneLessons.length / lessons.length : 0;

  // Find first incomplete lesson
  const currentLesson = lessons.find(l => !state.isLessonComplete(l.id)) ?? lessons[lessons.length - 1];

  // Build vertical lesson map
  const mapItems = lessons.map((lesson, i) => {
    const done    = state.isLessonComplete(lesson.id);
    const current = lesson.id === currentLesson?.id && !done;
    const locked  = !done && !current;

    const dotClass = done ? 'completed' : current ? 'current' : 'locked';
    const icon     = done ? '✓' : current ? '▶' : i + 1;

    const connClass = i < lessons.length - 1
      ? `lesson-connector${state.isLessonComplete(lessons[i + 1]?.id) || done ? ' done' : ''}`
      : '';

    const item = ce('div', { class: 'lesson-map-item' },
      ce('div', { class: 'lesson-map-spine' },
        ce('div', { class: `lesson-dot ${dotClass}`, text: String(icon) }),
        i < lessons.length - 1 ? ce('div', { class: connClass || 'lesson-connector' }) : null,
      ),
      ce('div', { class: 'lesson-map-content' },
        ce('div', {
          class: `lesson-name ${dotClass}`,
          text: lesson.title,
        }),
        ce('div', { class: 'lesson-meta', text: `+${lesson.xpReward} XP · ${lesson.challenges?.length ?? 0} challenges` }),
      ),
    );

    if (!locked) {
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => {
        window.location.hash = `lesson/${lesson.id}`;
      });
    }

    return item;
  });

  const header = ce('header', { class: 'app-header' },
    ce('button', { class: 'back-btn', onclick: goBack }, '‹ Back'),
    ce('h1', { text: track.title }),
    ce('span', { text: track.icon, style: 'font-size:24px' }),
  );

  const ctaBtn = ce('button', { class: 'btn btn-primary', onclick: () => {
    if (currentLesson) window.location.hash = `lesson/${currentLesson.id}`;
  }}, currentLesson ? `▶  ${state.isLessonComplete(currentLesson.id) ? 'Review: ' : 'Continue: '}${currentLesson.title}` : '✓ All complete!');

  const content = ce('div', { class: 'screen' },
    ce('div', { class: 'screen-content' },
      ce('div', { class: 'stat-card' },
        ce('div', { class: 'track-title', style: 'font-size:18px;font-weight:800;margin-bottom:4px', text: track.subtitle }),
        ce('div', { class: 'level-info', text: `${doneLessons.length} of ${lessons.length} lessons complete` }),
        ce('div', { class: 'progress-bar', style: 'margin-top:10px' },
          ce('div', { class: 'progress-bar-fill', style: `width:${Math.round(pct * 100)}%` }),
        ),
      ),
      ce('div', { class: 'lesson-map' }, ...mapItems),
    ),
    ce('div', { class: 'sticky-cta' }, ctaBtn),
  );

  render(appEl, header, content);
}

/* ── Lesson screen (theory sections) ────────────────────── */
export function renderLesson(appEl, lessonId) {
  const lesson = getLesson(lessonId);
  if (!lesson) { window.location.hash = 'home'; return; }

  const sections   = lesson.theory?.sections ?? [];
  const challenges = challengesForLesson(lessonId);

  // Resume: if the user has already started challenges, skip theory and jump
  // to the first incomplete challenge (or back to track if all are done).
  if (challenges.some(c => state.isChallengeComplete(c.id))) {
    const firstIncomplete = challenges.find(c => !state.isChallengeComplete(c.id));
    window.location.hash = firstIncomplete
      ? `challenge/${firstIncomplete.id}`
      : `track/${lesson.trackId}`;
    return;
  }

  let sectionIdx   = 0;

  function renderSection() {
    const section = sections[sectionIdx];
    const isLast  = sectionIdx === sections.length - 1;

    let sectionEl;
    if (section.type === 'text') {
      sectionEl = ce('div', { class: 'theory-section fade-in' },
        ce('div', { class: 'theory-text', html: parseInlineCode(section.content) }),
      );
    } else if (section.type === 'code') {
      sectionEl = ce('div', { class: 'theory-section fade-in' },
        ce('div', { class: 'code-block' },
          ce('pre', { text: section.content }),
        ),
      );
    } else if (section.type === 'output') {
      sectionEl = ce('div', { class: 'theory-section fade-in' },
        ce('div', { class: 'output-demo' },
          ce('div', { class: 'output-demo-label', text: 'Output' }),
          ce('pre', { text: section.content }),
        ),
      );
    } else {
      sectionEl = ce('div', { class: 'theory-section', text: section.content });
    }

    const pct = ((sectionIdx + 1) / (sections.length + challenges.length)) * 100;

    const nextBtn = ce('button', { class: 'btn btn-primary', onclick: () => {
      if (isLast) {
        // Go to first challenge
        if (challenges.length) window.location.hash = `challenge/${challenges[0].id}`;
        else window.location.hash = `track/${lesson.trackId}`;
      } else {
        sectionIdx++;
        renderSection();
      }
    }}, isLast ? (challenges.length ? 'Start Challenges →' : 'Complete Lesson →') : 'Next →');

    const progressFill = ce('div', { class: 'lesson-progress-bar-fill', style: `width:${pct}%` });
    const progressBar  = ce('div', { class: 'lesson-progress-bar' }, progressFill);

    const header = ce('header', { class: 'app-header', style: 'position:relative' },
      ce('button', { class: 'back-btn', onclick: () => { window.location.hash = `track/${lesson.trackId}`; } }, '‹'),
      ce('h1', { text: lesson.title }),
      ce('button', { class: 'icon-btn', title: 'Home', onclick: () => { window.location.hash = 'home'; } }, '🏠'),
      progressBar,
    );

    render(appEl,
      header,
      ce('div', { class: 'screen' },
        ce('div', { class: 'screen-content' },
          ce('div', { class: 'stat-card', style: 'background:transparent;border:none;padding:0' },
            ce('div', { class: 'section-label', text: lesson.projectContribution ?? '' }),
          ),
          sectionEl,
        ),
        ce('div', { class: 'sticky-cta' }, nextBtn),
      ),
    );
  }

  renderSection();
}

/** Convert `backtick code` to <code> tags */
function parseInlineCode(str) {
  return String(str).replace(/`([^`]+)`/g, '<code>$1</code>');
}
