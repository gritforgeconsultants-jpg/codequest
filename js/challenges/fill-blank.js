import { ce, render, qs, qsa } from '../utils/dom.js';

const PLACEHOLDER = '_____';

export function renderFillBlank(bodyEl, { ch, onComplete, onAttempt, onHint }) {
  let attempts    = 0;
  let hintIdx     = 0;
  let hintShown   = false;

  // Build template segments by splitting on placeholders
  const parts    = ch.template.split(PLACEHOLDER);
  const inputs   = [];
  const children = [];

  parts.forEach((part, i) => {
    children.push(document.createTextNode(part));
    if (i < parts.length - 1) {
      const blank = ch.blanks[i];
      const inp   = ce('input', {
        class: 'blank-input',
        type: 'text',
        placeholder: '...',
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
        spellcheck: 'false',
        style: `width:${Math.max(80, (blank?.answer?.length ?? 4) * 12 + 20)}px`,
      });
      inputs.push({ el: inp, blank });
      children.push(inp);
    }
  });

  const templateEl = ce('div', { class: 'fill-blank-template' }, ...children);

  // Hint
  const hints = ch.hints ?? (ch.hint ? [ch.hint] : []);
  const hintBox = ce('div', { class: 'hint-text', style: 'display:none' });
  const hintBtn = ce('button', { class: 'hint-btn', onclick: () => {
    if (hints.length === 0) return;
    hintShown = true;
    onHint();
    hintBox.textContent = hints[hintIdx % hints.length];
    hintBox.style.display = 'block';
    hintIdx++;
    if (hintIdx >= hints.length) hintBtn.disabled = true;
  }}, '💡 Hint');

  if (hints.length === 0) hintBtn.style.display = 'none';

  function checkAnswers() {
    attempts++;
    onAttempt();

    let allCorrect = true;
    for (const { el, blank } of inputs) {
      const val     = el.value.trim();
      const answer  = blank?.answer ?? '';
      const alts    = blank?.alternatives ?? [];
      const correct = blank?.caseSensitive
        ? (val === answer || alts.includes(val))
        : (val.toLowerCase() === answer.toLowerCase() || alts.map(a => a.toLowerCase()).includes(val.toLowerCase()));

      el.classList.toggle('correct',   correct);
      el.classList.toggle('incorrect', !correct);
      if (!correct) allCorrect = false;
    }

    if (allCorrect) {
      checkBtn.textContent = 'Continue →';
      checkBtn.className   = 'btn btn-success';
      checkBtn.onclick     = () => onComplete(true);
    } else {
      checkBtn.textContent = 'Try Again';
      checkBtn.className   = 'btn btn-danger';
      checkBtn.onclick     = () => {
        inputs.forEach(({ el }) => el.classList.remove('correct', 'incorrect'));
        checkBtn.textContent = 'Check Answer';
        checkBtn.className   = 'btn btn-primary';
        checkBtn.onclick     = checkAnswers;
      };
    }
  }

  const checkBtn = ce('button', { class: 'btn btn-primary', onclick: checkAnswers }, 'Check Answer');

  render(bodyEl,
    ce('div', { class: 'screen-content slide-in-right' },
      ce('div', { class: 'challenge-card' },
        ce('div', { class: 'challenge-type-badge', text: '✏️ Fill in the Blank' }),
        ce('div', { class: 'challenge-prompt', html: formatText(ch.prompt) }),
        templateEl,
        hintBtn,
        hintBox,
      ),
    ),
    ce('div', { class: 'sticky-cta' }, checkBtn),
  );

  // Focus first input
  setTimeout(() => inputs[0]?.el.focus(), 300);
}

function formatText(str) {
  return String(str).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\n/g, '<br>');
}
