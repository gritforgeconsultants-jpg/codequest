/**
 * runner.js — Central dispatch: routes execution to the correct engine.
 */
import { runJS }       from './sandbox-js.js';
import { runHTML }     from './sandbox-html.js';
import { runPython }   from './pyodide-runner.js';
import { runJudge0 }   from './judge0-runner.js';

/**
 * @param {string} executor - One of: 'pyodide' | 'browser-js' | 'browser-html' | 'judge0' | 'python' | 'javascript' | 'java' | 'html' | 'css'
 * @param {string} code
 * @param {string} [stdin]
 * @returns {Promise<{stdout:string, stderr:string, error:Error|null, html?:string}>}
 */
export async function run(executor, code, stdin = '') {
  switch (executor) {
    case 'pyodide':
    case 'python':
      return runPython(code);

    case 'browser-js':
    case 'javascript':
      return runJS(code);

    case 'browser-html':
    case 'html':
    case 'css':
      return runHTML(code);

    case 'judge0':
    case 'java':
      return runJudge0(code, 'java', stdin);

    default:
      return { stdout: '', stderr: `Unknown executor: ${executor}`, error: new Error('Unknown executor') };
  }
}
