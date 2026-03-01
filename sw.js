/**
 * Service Worker — Cache-First strategy for all static assets.
 * Pyodide CDN files (~10MB) are cached aggressively after first load.
 */

const CACHE_NAME = 'codequest-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/css/tokens.css',
  '/css/reset.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/editor.css',
  '/css/animations.css',
  '/js/app.js',
  '/js/state.js',
  '/js/curriculum.js',
  '/js/utils/dom.js',
  '/js/utils/fmt.js',
  '/js/engine/runner.js',
  '/js/engine/sandbox-js.js',
  '/js/engine/sandbox-html.js',
  '/js/engine/pyodide-runner.js',
  '/js/engine/judge0-runner.js',
  '/js/challenges/multiple-choice.js',
  '/js/challenges/fill-blank.js',
  '/js/challenges/free-code.js',
  '/js/challenges/fix-bug.js',
  '/js/gamification/xp.js',
  '/js/gamification/streak.js',
  '/js/gamification/badges.js',
  '/js/ui/screen-home.js',
  '/js/ui/screen-lesson.js',
  '/js/ui/screen-challenge.js',
  '/js/ui/screen-profile.js',
  '/js/ui/screen-settings.js',
  '/js/ui/editor-widget.js',
  '/js/ui/output-panel.js',
  '/js/ui/toast.js',
  '/data/curriculum.json',
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
        return caches.match('/offline.html');
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
