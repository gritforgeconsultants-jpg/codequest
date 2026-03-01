/**
 * editor-widget.js — Lightweight textarea-based code editor.
 * No external dependencies. Works everywhere, offline, always.
 *
 * Returns an object with:
 *   el         — the textarea element
 *   getValue() — get current code string
 *   setValue(s) — set code string
 */
export function createEditor(mountEl, initialCode, executor) {
  const textarea = document.createElement('textarea');
  textarea.className      = 'code-textarea';
  textarea.value          = initialCode ?? '';
  textarea.spellcheck     = false;
  textarea.autocorrect    = 'off';
  textarea.autocapitalize = 'off';
  textarea.autocomplete   = 'off';
  textarea.setAttribute('data-lang', executor ?? '');

  // Tab key inserts 4 spaces instead of moving focus
  textarea.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start  = textarea.selectionStart;
      const end    = textarea.selectionEnd;
      textarea.value = textarea.value.slice(0, start) + '    ' + textarea.value.slice(end);
      textarea.selectionStart = textarea.selectionEnd = start + 4;
    }
    // Enter: auto-indent to match current line
    if (e.key === 'Enter') {
      e.preventDefault();
      const start     = textarea.selectionStart;
      const text      = textarea.value;
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const curLine   = text.slice(lineStart, start);
      const indent    = curLine.match(/^(\s*)/)[1];
      // Extra indent after colon or opening brace
      const extra     = /[:{(]\s*$/.test(curLine.trimEnd()) ? '    ' : '';
      const insert    = '\n' + indent + extra;
      textarea.value  = text.slice(0, start) + insert + text.slice(textarea.selectionEnd);
      textarea.selectionStart = textarea.selectionEnd = start + insert.length;
    }
  });

  // Auto-resize height based on content
  function resize() {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(Math.max(textarea.scrollHeight, 120), 320) + 'px';
  }
  textarea.addEventListener('input', resize);

  mountEl.appendChild(textarea);
  requestAnimationFrame(resize);

  return {
    el: textarea,
    getValue() { return textarea.value; },
    setValue(code) { textarea.value = code; resize(); },
  };
}
