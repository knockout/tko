// Snippet injected into every preview iframe. Forwards console output and
// unhandled errors up to the parent window so the shell's console panel
// can render them. Shared between the IIFE and ESM runners so both
// playgrounds speak the same postMessage protocol.
const CONSOLE_FORWARD = `<script>
;['log','warn','error','info'].forEach(m => {
  const orig = console[m];
  console[m] = (...args) => {
    window.parent.postMessage({ type: 'console', method: m, args: args.map(a => {
      try { return typeof a === 'object' ? JSON.stringify(a) : String(a) } catch { return String(a) }
    }) }, '*');
    orig.apply(console, args);
  };
});
window.onerror = (msg) => {
  window.parent.postMessage({ type: 'error', message: String(msg) }, '*');
};
window.onunhandledrejection = (e) => {
  window.parent.postMessage({ type: 'error', message: String(e.reason) }, '*');
};
<\/script>
`

// Inject the forwarder early in the document. Preserves a leading
// <!doctype html> — prepending before the doctype would knock the
// iframe into quirks mode.
export function injectConsoleForward(html: string): string {
  const headClose = /<\/head>/i
  if (headClose.test(html)) return html.replace(headClose, `${CONSOLE_FORWARD}</head>`)
  const bodyOpen = /<body[^>]*>/i
  if (bodyOpen.test(html)) return html.replace(bodyOpen, (m) => `${m}${CONSOLE_FORWARD}`)
  const doctype = /<!doctype[^>]*>/i
  if (doctype.test(html)) return html.replace(doctype, (m) => `${m}\n${CONSOLE_FORWARD}`)
  return CONSOLE_FORWARD + html
}

// Defuse string-literal </script> in compiled JS embedded inside an
// inline <script> tag. Without this, an unlucky emit inside a string
// literal can terminate the script early.
export function escapeScriptBody(code: string): string {
  return code.replace(/<\/script/gi, '<\\/script')
}
