/**
 * app.js — Hash-based router. Mounts screens into #app.
 * Routes:
 *   #home                  → Home (track list)
 *   #track/:id             → Track screen (lesson map)
 *   #lesson/:id            → Lesson theory
 *   #challenge/:id         → Challenge
 *   #profile               → Profile / stats
 *   #settings              → Settings
 */

import { render } from './utils/dom.js';
import { renderHome }      from './ui/screen-home.js';
import { renderTrack }     from './ui/screen-lesson.js';
import { renderLesson }    from './ui/screen-lesson.js';
import { renderChallenge } from './ui/screen-challenge.js';
import { renderProfile }   from './ui/screen-profile.js';
import { renderSettings }  from './ui/screen-settings.js';
import { init as initCurriculum } from './curriculum.js';

const appEl = document.getElementById('app');

let _initialized = false;

async function init() {
  if (_initialized) return;
  _initialized = true;

  // Show loading until curriculum is ready
  appEl.innerHTML = `<div id="loading-screen"><div class="spinner"></div><p>Loading CodeQuest…</p></div>`;

  await initCurriculum();

  // Start routing
  window.addEventListener('hashchange', route);
  route();
}

function route() {
  const hash   = window.location.hash.slice(1) || 'home';
  const [path, ...parts] = hash.split('/');

  switch (path) {
    case 'home':
      renderHome(appEl);
      break;
    case 'track':
      renderTrack(appEl, parts[0]);
      break;
    case 'lesson':
      renderLesson(appEl, parts[0]);
      break;
    case 'challenge':
      renderChallenge(appEl, parts[0]);
      break;
    case 'profile':
      renderProfile(appEl);
      break;
    case 'settings':
      renderSettings(appEl);
      break;
    default:
      navigate('home');
  }
}

/** Navigate to a hash route */
export function navigate(route) {
  window.location.hash = route;
}

/** Go back in history (or home if no history) */
export function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    navigate('home');
  }
}

// Boot
init();
