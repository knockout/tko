// @ts-ignore — URL imports resolved at runtime
import * as esbuild from 'https://cdn.jsdelivr.net/npm/esbuild-wasm@0.27.4/esm/browser.min.js'
// @ts-ignore
import { EditorView, basicSetup } from 'https://esm.sh/codemirror@6.0.2'
// @ts-ignore
import { javascript } from 'https://esm.sh/@codemirror/lang-javascript@6.2.5'
// @ts-ignore
import { html as htmlLang } from 'https://esm.sh/@codemirror/lang-html@6.4.11'
// @ts-ignore
import { oneDark } from 'https://esm.sh/@codemirror/theme-one-dark@6.1.3'

import { mount } from './shell'
import { createIifeRunner } from './runner-iife'

mount(
  document.getElementById('app')!,
  {
    EditorView,
    basicSetup,
    oneDark,
    languages: {
      html: () => htmlLang(),
      tsx: () => javascript({ jsx: true, typescript: true }),
      js: () => javascript(),
    },
  },
  createIifeRunner(esbuild),
)
