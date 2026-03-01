import { ce, render, qs } from '../utils/dom.js';
import * as state from '../state.js';
import { goBack } from '../app.js';

export function renderSettings(appEl) {
  function row(label, desc, control) {
    return ce('div', { class: 'settings-row' },
      ce('div',
        ce('div', { class: 'settings-label', text: label }),
        ce('div', { class: 'settings-desc', text: desc }),
      ),
      control,
    );
  }

  // Judge0 API Key
  const apiKeyInput = ce('input', {
    class: 'text-input',
    type: 'password',
    placeholder: 'Paste your RapidAPI key here',
    value: state.get('settings.judge0ApiKey') ?? '',
    onchange: (e) => state.set('settings.judge0ApiKey', e.target.value.trim()),
  });

  // Sound toggle
  const soundToggle = ce('label', { class: 'toggle' },
    Object.assign(ce('input', { type: 'checkbox' }), { checked: state.get('settings.soundEnabled') ?? true }),
    ce('span', { class: 'toggle-slider' }),
  );
  soundToggle.querySelector('input').addEventListener('change', e => {
    state.set('settings.soundEnabled', e.target.checked);
  });

  // Reset progress
  const resetBtn = ce('button', { class: 'btn btn-danger', onclick: () => {
    if (confirm('Reset all progress? XP, streaks, and completed challenges will be lost.')) {
      state.resetProgress();
      alert('Progress reset.');
    }
  }}, '🗑 Reset Progress');

  const header = ce('header', { class: 'app-header' },
    ce('button', { class: 'back-btn', onclick: goBack }, '‹ Back'),
    ce('h1', { text: 'Settings' }),
  );

  render(appEl,
    header,
    ce('div', { class: 'screen' },
      ce('div', { class: 'screen-content' },
        ce('div', { class: 'section-label', text: 'Java Execution' }),
        ce('div', { class: 'stat-card' },
          ce('div', { class: 'settings-label', text: '☕ Judge0 API Key' }),
          ce('div', { class: 'settings-desc', text: 'Required to run Java challenges. Free at rapidapi.com → Judge0 CE. 50 runs/day.' }),
          ce('a', {
            href: 'https://rapidapi.com/judge0-official/api/judge0-ce',
            target: '_blank',
            style: 'display:inline-block;margin:8px 0;color:var(--accent);font-size:13px',
            text: '→ Get free API key',
          }),
          apiKeyInput,
        ),

        ce('div', { class: 'section-label', text: 'Preferences' }),
        ce('div', { class: 'stat-card' },
          row('🔊 Sound Effects', 'Play chimes on correct answers and level ups', soundToggle),
        ),

        ce('div', { class: 'section-label', text: 'Danger Zone' }),
        ce('div', { class: 'stat-card' },
          ce('div', { class: 'settings-desc', style: 'margin-bottom:12px', text: 'This will erase all your XP, streak, and challenge progress. Settings are kept.' }),
          resetBtn,
        ),
      ),
    ),
  );
}
