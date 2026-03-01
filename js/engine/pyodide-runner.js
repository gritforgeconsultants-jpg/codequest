/**
 * Run Python code via Pyodide (WebAssembly).
 * Lazy-loads Pyodide on first use. ~10MB, cached by browser + service worker.
 */

const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.27.4/full/pyodide.mjs';

let _pyodide = null;
let _loading = null;

function showLoader(msg) {
  let el = document.getElementById('pyodide-loader');
  if (!el) {
    el = document.createElement('div');
    el.id = 'pyodide-loader';
    Object.assign(el.style, {
      position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)', padding: '12px 20px',
      fontSize: '14px', color: 'var(--text-dim)',
      zIndex: '999', boxShadow: 'var(--shadow-lg)',
    });
    document.body.append(el);
  }
  el.textContent = msg;
}

function hideLoader() {
  document.getElementById('pyodide-loader')?.remove();
}

async function ensurePyodide() {
  if (_pyodide) return _pyodide;
  if (_loading) return _loading;

  _loading = (async () => {
    showLoader('⏳ Loading Python runtime (~10MB, cached after first use)…');
    try {
      const { loadPyodide } = await import(PYODIDE_CDN);
      _pyodide = await loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.4/full/',
      });
      hideLoader();
      return _pyodide;
    } catch (e) {
      hideLoader();
      throw new Error(`Failed to load Pyodide: ${e.message}`);
    }
  })();

  return _loading;
}

export async function runPython(code) {
  const py = await ensurePyodide();

  try {
    // Redirect stdout to a StringIO buffer
    py.runPython(`
import sys, io
_buf = io.StringIO()
sys.stdout = _buf
sys.stderr = _buf
`);

    let stderr = '';
    try {
      py.runPython(code);
    } catch (e) {
      stderr = e.message ?? String(e);
    }

    const stdout = py.runPython('_buf.getvalue()');

    // Restore stdout
    py.runPython(`sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__`);

    return { stdout: stdout ?? '', stderr, error: stderr ? new Error(stderr) : null };
  } catch (e) {
    return { stdout: '', stderr: e.message, error: e };
  }
}
