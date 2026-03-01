import { ce, render } from '../utils/dom.js';
import { createEditor } from '../ui/editor-widget.js';
import { renderOutputPanel, setOutput } from '../ui/output-panel.js';
import { run } from '../engine/runner.js';
import { normalizeOutput } from '../utils/fmt.js';

export function renderFreeCode(bodyEl, { ch, onComplete, onAttempt, onHint }) {
  let attempts  = 0;
  let hintIdx   = 0;
  const hints   = ch.hints ?? (ch.hint ? [ch.hint] : []);

  let editorView = null;
  const outputEl = ce('div');
  renderOutputPanel(outputEl, ch.executor ?? ch.language);

  const testCaseEls = (ch.testCases ?? [])
    .filter(tc => !tc.isHidden)
    .map(tc => {
      const dot = ce('div', { class: 'test-dot', title: tc.description });
      return { tc, dot };
    });

  const dotsEl = ce('div', { class: 'test-cases' }, ...testCaseEls.map(t => t.dot));

  const hints_ = ch.hints ?? (ch.hint ? [ch.hint] : []);
  const hintBox = ce('div', { class: 'hint-text', style: 'display:none' });
  const hintBtn = ce('button', { class: 'hint-btn', onclick: () => {
    if (!hints_.length) return;
    onHint();
    hintBox.textContent = hints_[hintIdx % hints_.length];
    hintBox.style.display = 'block';
    hintIdx++;
    if (hintIdx >= hints_.length) hintBtn.disabled = true;
  }}, '💡 Hint');
  if (!hints_.length) hintBtn.style.display = 'none';

  async function runAndCheck() {
    const code = editorView?.state.doc.toString() ?? '';
    attempts++;
    onAttempt();

    setOutput(outputEl, 'running', '');

    testCaseEls.forEach(({ dot }) => dot.className = 'test-dot running');

    let allPass = true;
    let outputLog = '';

    for (const { tc, dot } of testCaseEls) {
      const combined = [code, tc.setupCode ?? '', tc.callCode ?? ''].join('\n');
      try {
        const result = await run(ch.executor ?? ch.language, combined, tc.stdin ?? '');
        const actual = normalizeOutput(result.stdout);
        const expected = normalizeOutput(tc.expectedOutput);
        const pass = actual === expected;

        dot.className = `test-dot ${pass ? 'pass' : 'fail'}`;
        if (!pass) {
          allPass = false;
          outputLog += `✗ ${tc.description}\n  Expected: ${expected}\n  Got:      ${actual}\n`;
        } else {
          outputLog += `✓ ${tc.description}\n`;
        }

        if (result.stderr) {
          outputLog += `  Error: ${result.stderr}\n`;
          allPass = false;
          dot.className = 'test-dot fail';
        }
      } catch (e) {
        dot.className = 'test-dot fail';
        allPass = false;
        outputLog += `✗ ${tc.description}: ${e.message}\n`;
      }
    }

    setOutput(outputEl, allPass ? 'stdout' : 'stderr', outputLog);

    if (allPass) {
      runBtn.textContent = 'Continue →';
      runBtn.className   = 'btn btn-success';
      runBtn.onclick     = () => onComplete(true);
    }
  }

  const runBtn = ce('button', { class: 'btn btn-primary', onclick: runAndCheck }, '▶  Run & Check');

  const editorMount = ce('div');

  render(bodyEl,
    ce('div', { class: 'screen-content slide-in-right' },
      ce('div', { class: 'challenge-card' },
        ce('div', { class: 'challenge-type-badge', text: '💻 Write Code' }),
        ce('div', { class: 'challenge-prompt', html: formatText(ch.prompt) }),
      ),
      ce('div', { class: 'editor-wrapper' },
        ce('div', { class: 'editor-toolbar' },
          ce('span', { class: 'editor-lang-badge', text: ch.language ?? ch.executor ?? 'code' }),
        ),
        editorMount,
        buildMobileKeybar(ch.language ?? ch.executor),
      ),
      outputEl,
      dotsEl,
      hintBtn,
      hintBox,
    ),
    ce('div', { class: 'sticky-cta' }, runBtn),
  );

  // Mount CodeMirror after DOM is ready
  requestAnimationFrame(() => {
    editorView = createEditor(editorMount, ch.starterCode ?? '', ch.language ?? ch.executor);
  });
}

function formatText(str) {
  return String(str).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\n/g, '<br>');
}

function buildMobileKeybar(lang) {
  const keys = lang === 'python'
    ? ['def ', 'return ', 'print()', 'for ', 'in ', ':', '    ', '[]', '{}', '""']
    : lang === 'java'
    ? ['System.out.println()', 'public ', 'static ', 'void ', 'int ', 'String ', '{}', '();', '[]']
    : ['console.log()', 'function ', 'const ', 'return ', '{}', '[]', '=>', '()'];

  return ce('div', { class: 'mobile-keys' },
    ...keys.map(k => {
      const btn = ce('button', { class: 'mobile-key', text: k });
      // inject key at cursor would require CM6 integration — for now just copy to clipboard hint
      return btn;
    }),
  );
}
