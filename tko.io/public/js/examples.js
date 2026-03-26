import * as esbuild from 'https://cdn.jsdelivr.net/npm/esbuild-wasm@0.27.4/esm/browser.min.js';
import { EditorView, basicSetup } from 'https://esm.sh/codemirror@6.0.2';
import { javascript } from 'https://esm.sh/@codemirror/lang-javascript@6.2.5';
import { oneDark } from 'https://esm.sh/@codemirror/theme-one-dark@6.1.3';

let esbuildInitialized = false;

function parseLegacyExampleId(rawParams) {
  const match = rawParams?.match(/id:\s*["']?([^"'}\s]+)["']?/i);
  return match?.[1] || 'legacy-example';
}

function createLegacyExamplePlaceholder(exampleNode) {
  const exampleId = parseLegacyExampleId(exampleNode.getAttribute('params') || '');
  const container = document.createElement('div');
  container.className = 'example-placeholder';
  container.dataset.exampleId = exampleId;
  container.innerHTML = `
    <div class="example-placeholder__label">Live example in progress</div>
    <p>This page still references the legacy example <code>${exampleId}</code>.</p>
    <p>The interactive example system is being rebuilt for the Starlight site. Use the code snippets on this page as the current reference for now.</p>
  `;
  exampleNode.replaceWith(container);
}

async function initEsbuild() {
  if (!esbuildInitialized) {
    await esbuild.initialize({
      wasmURL: 'https://cdn.jsdelivr.net/npm/esbuild-wasm@0.27.4/esbuild.wasm'
    });
    esbuildInitialized = true;
  }
}

async function transformJSX(code) {
  try {
    await initEsbuild();

    const result = await esbuild.transform(code, {
      loader: 'jsx',
      jsx: 'transform',
      jsxFactory: 'ko.jsx.createElement',
      jsxFragment: 'ko.jsx.Fragment'
    });
    return { success: true, code: result.code };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function createExampleContainer(codeBlock) {
  const container = document.createElement('div');
  container.className = 'example-container';

  // Create editor wrapper
  const editorWrapper = document.createElement('div');
  editorWrapper.className = 'example-editor';

  const iframe = document.createElement('iframe');
  iframe.className = 'example-result';

  container.appendChild(editorWrapper);
  container.appendChild(iframe);

  // Replace the code block with our interactive container
  const pre = codeBlock.parentElement;
  pre.parentNode.replaceChild(container, pre);

  // Create CodeMirror editor
  const initialCode = codeBlock.textContent.trim();
  let timeout;

  const editor = new EditorView({
    doc: initialCode,
    extensions: [
      basicSetup,
      javascript({ jsx: true }),
      oneDark,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          // Re-run on change (debounced)
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            const code = editor.state.doc.toString();
            runExample(code, iframe, container);
          }, 500);
        }
      })
    ],
    parent: editorWrapper
  });

  // Run the code initially
  runExample(initialCode, iframe, container);
}

async function runExample(code, iframe, container) {
  const result = await transformJSX(code);

  if (result.success) {
    // Create a complete HTML document for the iframe
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              margin: 16px;
              font-family: 'Nunito', sans-serif;
            }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script src="/lib/tko.js"></script>
          <script>
            // TKO exports as 'tko', create 'ko' alias for compatibility
            window.ko = window.tko;

            // Wait for next tick to ensure TKO is fully loaded
            setTimeout(() => {
              try {
                ${result.code}
              } catch (e) {
                console.error('Example error:', e);
              }
            }, 0);
          </script>
        </body>
      </html>
    `;

    // Use srcdoc for better iframe content handling
    iframe.srcdoc = html;

    // Remove any error display
    const existingError = container.querySelector('.example-error');
    if (existingError) {
      existingError.remove();
    }
  } else {
    // Display error overlaying the preview panel
    let errorDiv = container.querySelector('.example-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'example-error';
      container.appendChild(errorDiv);
    }
    errorDiv.textContent = `Error: ${result.error}`;
  }
}

// Initialize examples when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExamples);
} else {
  initExamples();
}

function initExamples() {
  document.querySelectorAll('live-example').forEach(createLegacyExamplePlaceholder);

  // Find all code blocks with language 'jsx'
  const codeBlocks = document.querySelectorAll('pre code.language-jsx');
  codeBlocks.forEach(createExampleContainer);
}
