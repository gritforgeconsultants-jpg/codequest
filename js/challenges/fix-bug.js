import { ce, render } from '../utils/dom.js';
import { createEditor } from '../ui/editor-widget.js';
import { renderOutputPanel, setOutput } from '../ui/output-panel.js';
import { run } from '../engine/runner.js';
import { normalizeOutput } from '../utils/fmt.js';

export function renderFixBug(bodyEl, { ch, onComplete, onAttempt, onHint }) {
  let attempts = 0;
  let hintIdx  = 0;
  const hints  = ch.hints ?? (ch.hint ? [ch.hint] : []);

  let editorView = null;
  const outputEl = ce('div');
  renderOutputPanel(outputEl, ch.executor ?? ch.language);

  const hintBox = ce('div', { class: 'hint-text', style: 'display:none' });
  const hintBtn = ce('button', { class: 'hint-btn', onclick: () => {
    if (!hints.length) return;
    onHint();
    hintBox.textContent = `Hint ${hintIdx + 1}/${hints.length}: ${hints[hintIdx % hints.length]}`;
    hintBox.style.display = 'block';
    hintIdx++;
    if (hintIdx >= hints.length) hintBtn.disabled = true;
  }}, `💡 Hint (${hints.length})`);
  if (!hints.length) hintBtn.style.display = 'none';

  async function runAndCheck() {
    const code = editorView?.state.doc.toString() ?? '';
    attempts++;
    onAttempt();

    setOutput(outputEl, 'running', '');

    let allPass  = true;
    let outputLog = '';

    for (const tc of (ch.testCases ?? [])) {
      const combined = [code, tc.setupCode ?? '', tc.callCode ?? ''].join('\n');
      try {
        const result  = await run(ch.executor ?? ch.language, combined, tc.stdin ?? '');
        const actual   = normalizeOutput(result.stdout);
        const expected = normalizeOutput(tc.expectedOutput);
        const pass     = actual === expected && !result.stderr;

        if (!pass) {
          allPass = false;
          outputLog += `✗ ${tc.description}\n`;
          if (result.stderr)   outputLog += `  Error: ${result.stderr}\n`;
          else outputLog += `  Expected: ${expected}\n  Got:      ${actual}\n`;
        } else {
          outputLog += `✓ ${tc.description}\n`;
        }
      } catch (e) {
        allPass = false;
        outputLog += `✗ ${tc.description}: ${e.message}\n`;
      }
    }

    setOutput(outputEl, allPass ? 'stdout' : 'stderr', outputLog);

    if (allPass) {
      checkBtn.textContent = 'Continue →';
      checkBtn.className   = 'btn btn-success';
      checkBtn.onclick     = () => onComplete(true);
    }
  }

  const checkBtn = ce('button', { class: 'btn btn-primary', onclick: runAndCheck }, '🔍 Check Fix');

  const editorMount = ce('div');

  render(bodyEl,
    ce('div', { class: 'screen-content slide-in-right' },
      ce('div', { class: 'challenge-card' },
        ce('div', { class: 'challenge-type-badge', text: '🐛 Fix the Bug' }),
        ce('div', { class: 'challenge-prompt', html: formatText(ch.prompt) }),
      ),
      ce('div', { class: 'editor-wrapper' },
        ce('div', { class: 'editor-toolbar' },
          ce('span', { class: 'editor-lang-badge', text: ch.language ?? ch.executor ?? 'code' }),
        ),
        editorMount,
      ),
      outputEl,
      hintBtn,
      hintBox,
    ),
    ce('div', { class: 'sticky-cta' }, checkBtn),
  );

  requestAnimationFrame(() => {
    editorView = createEditor(editorMount, ch.buggyCode ?? '', ch.language ?? ch.executor);
  });
}

function formatText(str) {
  return String(str).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\n/g, '<br>');
}
