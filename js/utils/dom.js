/** querySelector shorthand */
export const qs  = (sel, el = document) => el.querySelector(sel);

/** querySelectorAll shorthand */
export const qsa = (sel, el = document) => [...el.querySelectorAll(sel)];

/** createElement with optional attrs and children */
export function ce(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k === 'html')  el.innerHTML = v;
    else if (k === 'text')  el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  }
  for (const child of children.flat()) {
    if (child == null) continue;
    el.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return el;
}

/** Add event listener, returns remove function */
export function on(el, event, handler, options) {
  el.addEventListener(event, handler, options);
  return () => el.removeEventListener(event, handler, options);
}

/** Replace the contents of a container */
export function render(container, ...nodes) {
  container.replaceChildren(...nodes.flat().filter(Boolean));
}

/** Escape HTML for safe insertion */
export function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
