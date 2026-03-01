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

import { renderHome }      from './ui/screen-home.js';
import { renderTrack }     from './ui/screen-lesson.js';
import { renderLesson }    from './ui/screen-lesson.js';
import { renderChallenge } from './ui/screen-challenge.js';
import { renderProfile }   from './ui/screen-profile.js';
import { renderSettings }  from './ui/screen-settings.js';
import { init as initCurriculum } from './curriculum.js';

const appEl = document.getElementById('app');

async function init() {
  try {
    await initCurriculum();
    window.addEventListener('hashchange', route);
    route();
  } catch (err) {
    appEl.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                  min-height:100dvh;padding:32px;text-align:center;gap:16px;color:#E8E8F0">
        <div style="font-size:48px">⚠️</div>
        <div style="font-size:20px;font-weight:700">Failed to load</div>
        <div style="color:#9090B0;font-size:14px;max-width:300px">
          ${err.message}<br><br>
          Make sure you're running from a local server, not file://
        </div>
        <button onclick="location.reload()"
          style="margin-top:8px;padding:14px 28px;background:#6C63FF;color:#fff;
                 border:none;border-radius:14px;font-size:16px;font-weight:600;cursor:pointer">
          Retry
        </button>
      </div>`;
  }
}

function route() {
  const hash   = window.location.hash.slice(1) || 'home';
  const [path, ...parts] = hash.split('/');

  try {
    switch (path) {
      case 'home':      renderHome(appEl);                break;
      case 'track':     renderTrack(appEl, parts[0]);     break;
      case 'lesson':    renderLesson(appEl, parts[0]);    break;
      case 'challenge': renderChallenge(appEl, parts[0]); break;
      case 'profile':   renderProfile(appEl);             break;
      case 'settings':  renderSettings(appEl);            break;
      default:          window.location.hash = 'home';
    }
  } catch (err) {
    console.error('Route error:', err);
    if (path !== 'home') {
      window.location.hash = 'home';
    } else {
      appEl.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                    min-height:100dvh;padding:32px;text-align:center;gap:16px;color:#E8E8F0">
          <div style="font-size:48px">⚠️</div>
          <div style="font-size:20px;font-weight:700">Something went wrong</div>
          <div style="color:#9090B0;font-size:13px;max-width:320px;word-break:break-word">
            ${err.message || String(err)}
          </div>
          <button onclick="location.reload()"
            style="margin-top:8px;padding:14px 28px;background:#6C63FF;color:#fff;
                   border:none;border-radius:14px;font-size:16px;font-weight:600;cursor:pointer">
            Reload
          </button>
        </div>`;
    }
  }
}

export function navigate(route) {
  window.location.hash = route;
}

export function goBack() {
  if (window.history.length > 1) window.history.back();
  else window.location.hash = 'home';
}

window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled rejection:', event.reason);
});

init();
