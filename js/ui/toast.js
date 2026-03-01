import { ce } from '../utils/dom.js';
import { fmtXP } from '../utils/fmt.js';
import * as state from '../state.js';

const SOUNDS = {};

function getSound(name) {
  if (!state.get('settings.soundEnabled')) return null;
  if (!SOUNDS[name]) {
    SOUNDS[name] = new Audio(`assets/sounds/${name}.mp3`);
    SOUNDS[name].volume = 0.4;
  }
  return SOUNDS[name];
}

function playSound(name) {
  try { getSound(name)?.play(); } catch { /* ignore */ }
}

/** Float an XP pop from a source element */
export function xpPop(xp, sourceEl) {
  const rect   = sourceEl?.getBoundingClientRect() ?? { top: 200, left: window.innerWidth / 2 };
  const popup  = ce('div', { class: 'xp-pop', text: `+${fmtXP(xp)} XP` });
  popup.style.cssText = `top:${rect.top - 10}px;left:${rect.left + (rect.width / 2)}px;transform:translateX(-50%)`;
  document.body.append(popup);
  popup.addEventListener('animationend', () => popup.remove());
}

/** Show a level-up modal */
export function levelUp(newLevel, title) {
  playSound('levelup');

  // Flash
  const flash = ce('div', { class: 'level-up-flash' });
  document.body.append(flash);
  flash.addEventListener('animationend', () => flash.remove());

  // Banner toast
  const banner = ce('div', {
    class: 'level-up-banner',
    style: 'position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:999;min-width:220px;text-align:center;animation:fadeInAnim 0.3s ease',
    html: `🎉 Level Up! You're now Level ${newLevel}<br><span style="font-size:14px;font-weight:400;opacity:0.8">${title}</span>`,
  });
  document.body.append(banner);
  setTimeout(() => banner.remove(), 3000);
}

/** Show a badge unlock toast */
export function badgeUnlock(badge) {
  const toast = ce('div', {
    class: 'fade-in',
    style: `
      position:fixed;bottom:100px;left:50%;transform:translateX(-50%);z-index:999;
      background:var(--surface);border:1px solid var(--warn);border-radius:var(--r-lg);
      padding:12px 20px;display:flex;align-items:center;gap:12px;
      box-shadow:var(--shadow-lg);min-width:200px;max-width:320px;
    `,
    html: `<span style="font-size:28px">${badge.icon}</span>
           <div><div style="font-weight:700;font-size:14px">Badge Unlocked!</div>
           <div style="font-size:12px;color:var(--text-dim)">${badge.title}</div></div>`,
  });
  document.body.append(toast);
  setTimeout(() => {
    toast.style.animation = 'none';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/** Play correct sound */
export function correct() { playSound('correct'); }
