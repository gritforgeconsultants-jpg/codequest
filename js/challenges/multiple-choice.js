import { ce, render } from '../utils/dom.js';

const LETTERS = ['A', 'B', 'C', 'D'];

export function renderMCQ(bodyEl, { ch, onComplete, onAttempt }) {
  let answered = false;

  const optionEls = ch.options.map((opt, i) => {
    const btn = ce('button', { class: 'mcq-option', onclick: () => select(opt.id, btn) },
      ce('span', { class: 'mcq-letter', text: LETTERS[i] }),
      ce('span', { class: 'mcq-text', html: formatText(opt.text) }),
    );
    return btn;
  });

  function select(selectedId, btn) {
    if (answered) return;
    answered = true;
    onAttempt();

    const correct = selectedId === ch.correctId;

    optionEls.forEach(el => {
      const isCorrect = el === btn ? correct : false;
      const id = ch.options[optionEls.indexOf(el)].id;
      if (id === ch.correctId) el.classList.add('correct');
      else if (el === btn && !correct) el.classList.add('incorrect');
    });

    // Show explanation
    const explanationEl = bodyEl.querySelector('.explanation-box');
    if (explanationEl) {
      explanationEl.classList.toggle('error', !correct);
      explanationEl.textContent = correct
        ? (ch.explanation ?? ch.successMessage ?? 'Correct!')
        : `Incorrect. ${ch.explanation ?? ''}`;
      explanationEl.style.display = 'block';
    }

    checkBtn.textContent = correct ? 'Continue →' : 'Try Again';
    checkBtn.className   = `btn ${correct ? 'btn-success' : 'btn-danger'}`;

    if (correct) {
      btn.classList.add('correct-bounce');
      checkBtn.onclick = () => onComplete(true);
    } else {
      btn.classList.add('wrong-shake');
      // Allow retry
      checkBtn.onclick = () => {
        answered = false;
        optionEls.forEach(el => { el.classList.remove('correct', 'incorrect', 'selected'); });
        explanationEl.style.display = 'none';
        checkBtn.textContent = 'Check Answer';
        checkBtn.className   = 'btn btn-primary';
        checkBtn.onclick     = checkHandler;
      };
    }
  }

  function checkHandler() {
    const selected = optionEls.find(el => el.classList.contains('selected'));
    if (!selected) return;
    const idx = optionEls.indexOf(selected);
    select(ch.options[idx].id, selected);
  }

  optionEls.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      optionEls.forEach(el => el.classList.remove('selected'));
      btn.classList.add('selected');
    }, true);
  });

  const checkBtn = ce('button', { class: 'btn btn-primary', onclick: checkHandler }, 'Check Answer');

  const explanationEl = ce('div', { class: 'explanation-box', style: 'display:none' });

  render(bodyEl,
    ce('div', { class: 'screen-content slide-in-right' },
      ce('div', { class: 'challenge-card' },
        ce('div', { class: 'challenge-type-badge', text: '❓ Multiple Choice' }),
        ce('div', { class: 'challenge-prompt', html: formatText(ch.prompt) }),
        ce('div', { class: 'mcq-options' }, ...optionEls),
        explanationEl,
      ),
    ),
    ce('div', { class: 'sticky-cta' }, checkBtn),
  );
}

/** Bold `backtick code`, handle newlines */
function formatText(str) {
  return String(str)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}
