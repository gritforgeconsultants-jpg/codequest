/**
 * editor-widget.js — CodeMirror 6 wrapper.
 * Creates an EditorView and mounts it into a container element.
 */
import { EditorView, keymap, lineNumbers, highlightActiveLine } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { oneDark } from '@codemirror/theme-one-dark';
import { python }     from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { java }       from '@codemirror/lang-java';
import { html }       from '@codemirror/lang-html';
import { css }        from '@codemirror/lang-css';
import { autocompletion } from '@codemirror/autocomplete';

function getLang(executor) {
  switch (executor) {
    case 'python':      case 'pyodide':      return python();
    case 'javascript':  case 'browser-js':   return javascript();
    case 'java':        case 'judge0':       return java();
    case 'html':        case 'browser-html': return html();
    case 'css':                              return css();
    default: return [];
  }
}

/**
 * Create and mount a CodeMirror 6 editor.
 * @param {HTMLElement} mountEl - container to mount into
 * @param {string} initialCode
 * @param {string} executor - language/executor string
 * @returns {EditorView}
 */
export function createEditor(mountEl, initialCode, executor = 'python') {
  const view = new EditorView({
    state: EditorState.create({
      doc: initialCode,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        keymap.of([...defaultKeymap, indentWithTab]),
        getLang(executor),
        oneDark,
        autocompletion(),
        EditorView.lineWrapping,
        EditorView.theme({
          '&': { fontSize: '14px', minHeight: '120px', maxHeight: '280px' },
          '.cm-scroller': { overflow: 'auto', fontFamily: "'Fira Code', 'Consolas', monospace" },
        }),
      ],
    }),
    parent: mountEl,
  });

  return view;
}
