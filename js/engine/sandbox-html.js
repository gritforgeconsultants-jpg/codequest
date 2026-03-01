/**
 * "Execute" HTML/CSS by rendering it in an iframe.
 * Returns a special result type that the output panel handles.
 */
export async function runHTML(code) {
  return {
    stdout: '',
    stderr: '',
    error:  null,
    html:   code,  // output-panel.js renders this in an iframe
  };
}
