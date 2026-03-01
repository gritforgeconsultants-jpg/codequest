/**
 * Service Worker — Cache-First strategy for all static assets.
 * Pyodide CDN files (~10MB) are cached aggressively after first load.
 */

const CACHE_NAME = 'codequest-v1';

// Build relative paths based on sw.js location
const BASE = self.location.pathname.replace('/sw.js', '/');

const STATIC_ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'offline.html',
  BASE + 'manifest.json',
  BASE + 'css/tokens.css',
  BASE + 'css/reset.css',
  BASE + 'css/layout.css',
  BASE + 'css/components.css',
  BASE + 'css/editor.css',
  BASE + 'css/animations.css',
  BASE + 'js/app.js',
  BASE + 'js/state.js',
  BASE + 'js/curriculum.js',
  BASE + 'js/utils/dom.js',
  BASE + 'js/utils/fmt.js',
  BASE + 'js/engine/runner.js',
  BASE + 'js/engine/sandbox-js.js',
  BASE + 'js/engine/sandbox-html.js',
  BASE + 'js/engine/pyodide-runner.js',
  BASE + 'js/engine/judge0-runner.js',
  BASE + 'js/challenges/multiple-choice.js',
  BASE + 'js/challenges/fill-blank.js',
  BASE + 'js/challenges/free-code.js',
  BASE + 'js/challenges/fix-bug.js',
  BASE + 'js/gamification/xp.js',
  BASE + 'js/gamification/streak.js',
  BASE + 'js/gamification/badges.js',
  BASE + 'js/ui/screen-home.js',
  BASE + 'js/ui/screen-lesson.js',
  BASE + 'js/ui/screen-challenge.js',
  BASE + 'js/ui/screen-profile.js',
  BASE + 'js/ui/screen-settings.js',
  BASE + 'js/ui/editor-widget.js',
  BASE + 'js/ui/output-panel.js',
  BASE + 'js/ui/toast.js',
  BASE + 'data/curriculum.json',
];

// ── Install: pre-cache all static assets ──────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: remove old caches ───────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first with smart routing ─────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Never cache code execution API calls
  if (url.hostname.includes('judge0') || url.hostname.includes('rapidapi')) {
    return; // network only
  }

  // Cache CDN resources (Pyodide, CodeMirror, fonts)
  const isCDN = url.hostname.includes('cdn.jsdelivr') ||
                url.hostname.includes('esm.sh') ||
                url.hostname.includes('fonts.googleapis') ||
                url.hostname.includes('fonts.gstatic');

  if (isCDN) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Own assets: cache-first, fallback to offline page
  event.respondWith(
    cacheFirst(event.request).catch(() => {
      if (event.request.mode === 'navigate') {
        return caches.match(BASE + 'offline.html');
      }
    })
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.status === 200) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}
