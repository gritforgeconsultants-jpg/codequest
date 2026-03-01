import { ce, render } from '../utils/dom.js';

/**
 * Render an output panel shell into a container element.
 * Call setOutput() to update its content.
 */
export function renderOutputPanel(container, executor) {
  const isHtml = executor === 'browser-html' || executor === 'html' || executor === 'css';

  const contentEl = isHtml
    ? ce('iframe', { class: 'output-iframe', sandbox: 'allow-scripts', title: 'Preview' })
    : ce('div', { class: 'output-content empty', text: 'Run your code to see output…' });

  container.replaceChildren(
    ce('div', { class: 'output-panel' },
      ce('div', { class: 'output-panel-header' },
        ce('span', { class: 'output-panel-title', text: isHtml ? '🖥 Preview' : '▶ Output' }),
      ),
      contentEl,
    ),
  );

  container._contentEl = contentEl;
  container._isHtml    = isHtml;
}

/**
 * Update the output panel content.
 * @param {HTMLElement} container - the panel container
 * @param {'stdout'|'stderr'|'running'|'empty'} type
 * @param {string} text - output text (or HTML string for iframe)
 * @param {string} [html] - for iframe panels
 */
export function setOutput(container, type, text, html) {
  const el      = container._contentEl;
  const isHtml  = container._isHtml;

  if (!el) return;

  if (isHtml) {
    // Iframe srcdoc preview
    el.srcdoc = html ?? text ?? '';
    return;
  }

  el.className = `output-content ${type}`;

  if (type === 'running') {
    el.textContent = 'Running';
    el.classList.add('running-dots');
  } else if (type === 'empty') {
    el.textContent = 'Run your code to see output…';
  } else {
    el.classList.remove('running-dots');
    el.textContent = text || (type === 'stdout' ? '(no output)' : '');
  }
}
