/**
 * Execute JavaScript in a sandboxed scope.
 * Intercepts console.log output and captures it as stdout.
 */
export async function runJS(code) {
  const logs = [];
  const fakeConsole = {
    log:   (...args) => logs.push(args.map(stringify).join(' ')),
    warn:  (...args) => logs.push(args.map(stringify).join(' ')),
    error: (...args) => logs.push(args.map(stringify).join(' ')),
    info:  (...args) => logs.push(args.map(stringify).join(' ')),
  };

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('console', code);
    const result = fn(fakeConsole);
    // Handle async code
    if (result && typeof result.then === 'function') await result;
    return { stdout: logs.join('\n'), stderr: '', error: null };
  } catch (e) {
    return { stdout: logs.join('\n'), stderr: e.message, error: e };
  }
}

function stringify(val) {
  if (val === null)       return 'null';
  if (val === undefined)  return 'undefined';
  if (typeof val === 'object') {
    try { return JSON.stringify(val, null, 2); } catch { return String(val); }
  }
  return String(val);
}
