import { ce, render } from '../utils/dom.js';
import { createEditor } from '../ui/editor-widget.js';
import { renderOutputPanel, setOutput } from '../ui/output-panel.js';
import { run } from '../engine/runner.js';
import { normalizeOutput } from '../utils/fmt.js';

export function renderFreeCode(bodyEl, { ch, onComplete, onAttempt, onHint }) {
  let hintIdx  = 0;
  const hints  = ch.hints ?? (ch.hint ? [ch.hint] : []);

  const outputEl = ce('div');
  renderOutputPanel(outputEl, ch.executor ?? ch.language);

  const testCaseEls = (ch.testCases ?? [])
    .filter(tc => !tc.isHidden)
    .map(tc => ({ tc, dot: ce('div', { class: 'test-dot', title: tc.description }) }));

  const dotsEl = ce('div', { class: 'test-cases' }, ...testCaseEls.map(t => t.dot));

  const hintBox = ce('div', { class: 'hint-text', style: 'display:none' });
  const hintBtn = ce('button', { class: 'hint-btn', onclick: () => {
    if (!hints.length) return;
    onHint();
    hintBox.textContent = hints[hintIdx % hints.length];
    hintBox.style.display = 'block';
    hintIdx++;
    if (hintIdx >= hints.length) hintBtn.disabled = true;
  }}, '💡 Hint');
  if (!hints.length) hintBtn.style.display = 'none';

  const editorMount = ce('div');
  let editor = null;

  async function runAndCheck() {
    const code = editor ? editor.getValue() : '';
    onAttempt();
    setOutput(outputEl, 'running', '');
    testCaseEls.forEach(({ dot }) => dot.className = 'test-dot running');

    let allPass  = true;
    let outputLog = '';

    for (const { tc, dot } of testCaseEls) {
      const combined = [code, tc.setupCode ?? '', tc.callCode ?? ''].filter(Boolean).join('\n');
      try {
        const result   = await run(ch.executor ?? ch.language, combined, tc.stdin ?? '');
        const actual   = normalizeOutput(result.stdout);
        const expected = normalizeOutput(tc.expectedOutput);
        const pass     = actual === expected && !result.stderr;
        dot.className  = `test-dot ${pass ? 'pass' : 'fail'}`;
        if (!pass) {
          allPass = false;
          outputLog += result.stderr
            ? `✗ ${tc.description}\n  Error: ${result.stderr}\n`
            : `✗ ${tc.description}\n  Expected: "${expected}"\n  Got:      "${actual}"\n`;
        } else {
          outputLog += `✓ ${tc.description}\n`;
        }
      } catch (e) {
        dot.className = 'test-dot fail';
        allPass = false;
        outputLog += `✗ ${tc.description}: ${e.message}\n`;
      }
    }

    setOutput(outputEl, allPass ? 'stdout' : 'stderr', outputLog.trim() || '(no output)');
    if (allPass) {
      runBtn.textContent = 'Continue →';
      runBtn.className   = 'btn btn-success';
      runBtn.onclick     = () => onComplete(true);
    }
  }

  const runBtn = ce('button', { class: 'btn btn-primary', onclick: runAndCheck }, '▶  Run & Check');

  render(bodyEl,
    ce('div', { class: 'screen-content slide-in-right' },
      ce('div', { class: 'challenge-card' },
        ce('div', { class: 'challenge-type-badge', text: '💻 Write Code' }),
        ce('div', { class: 'challenge-prompt', html: fmtText(ch.prompt) }),
      ),
      ce('div', { class: 'editor-wrapper' },
        ce('div', { class: 'editor-toolbar' },
          ce('span', { class: 'editor-lang-badge', text: ch.language ?? ch.executor ?? 'code' }),
        ),
        editorMount,
      ),
      outputEl,
      dotsEl,
      hintBtn,
      hintBox,
    ),
    ce('div', { class: 'sticky-cta' }, runBtn),
  );

  requestAnimationFrame(() => {
    editor = createEditor(editorMount, ch.starterCode ?? '', ch.language ?? ch.executor);
  });
}

function fmtText(str) {
  return String(str).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\n/g, '<br>');
}
