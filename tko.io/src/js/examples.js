import * as esbuild from 'https://cdn.jsdelivr.net/npm/esbuild-wasm@0.24.0/esm/browser.min.js';

let esbuildInitialized = false;

async function initEsbuild() {
  if (!esbuildInitialized) {
    await esbuild.initialize({
      wasmURL: 'https://cdn.jsdelivr.net/npm/esbuild-wasm@0.24.0/esbuild.wasm'
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

  const textarea = document.createElement('textarea');
  textarea.className = 'example-textarea';
  textarea.value = codeBlock.textContent.trim();

  const iframe = document.createElement('iframe');
  iframe.className = 'example-result';

  container.appendChild(textarea);
  container.appendChild(iframe);

  // Replace the code block with our interactive container
  const pre = codeBlock.parentElement;
  pre.parentNode.replaceChild(container, pre);

  // Run the code initially
  runExample(textarea, iframe);

  // Re-run on change (debounced)
  let timeout;
  textarea.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => runExample(textarea, iframe), 500);
  });
}

async function runExample(textarea, iframe) {
  const code = textarea.value;
  const result = await transformJSX(code);
  const container = textarea.parentElement;

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
          <script src="/lib/tko.js?${Date.now()}"></script>
          <script>
            // TKO exports as 'tko', create 'ko' alias for compatibility
            window.ko = window.tko;
          </script>
          <script>
            ${result.code}
          </script>
        </body>
      </html>
    `;

    // Write to iframe
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

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
  // Find all code blocks with language 'jsx'
  const codeBlocks = document.querySelectorAll('pre code.language-jsx');
  codeBlocks.forEach(createExampleContainer);
}
