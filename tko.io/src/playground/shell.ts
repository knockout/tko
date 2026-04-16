import type { Runner, RunnerStatus, EditorLang } from './runner'

export interface ShellDeps {
  EditorView: any
  basicSetup: any
  oneDark: any
  languages: Record<EditorLang, () => any>
}

function loadFromHash(): Record<string, string> | null {
  if (!location.hash) return null
  try {
    const json = decodeURIComponent(atob(location.hash.slice(1)))
    const parsed = JSON.parse(json)
    return typeof parsed === 'object' && parsed !== null ? parsed : null
  } catch {
    return null
  }
}

function saveToHash(files: Record<string, string>): void {
  const json = JSON.stringify(files)
  location.hash = btoa(encodeURIComponent(json))
}

export function mount(container: HTMLElement, deps: ShellDeps, runner: Runner): void {
  const { EditorView, basicSetup, oneDark, languages } = deps

  container.innerHTML = `
    <div class="playground">
      <header class="header">
        <div class="header-title">
          <a href="/">TKO</a> <span>/ ${runner.title}</span>
        </div>
        <div class="header-actions">
          <button class="btn btn--primary" data-role="run" title="Run (Ctrl+Enter)">Run</button>
        </div>
      </header>

      <div class="panels" style="position: relative;">
        <div class="loading-overlay" data-role="loading">Initializing...</div>

        <div class="editor-panel" data-role="editor-panel">
          <div class="tabs" role="tablist" data-role="tabs"></div>
        </div>

        <div class="preview-panel">
          <iframe class="preview-frame" data-role="preview" sandbox="allow-scripts"></iframe>
          <div class="error-bar" data-role="error-bar" hidden></div>
          <div class="console-panel">
            <div class="console-header">
              <span>Console</span>
              <button class="console-clear" data-role="console-clear">Clear</button>
            </div>
            <div class="console-messages" data-role="console-messages"></div>
          </div>
        </div>
      </div>

      <div class="status-bar">
        <span data-role="status"><span class="dot dot--loading"></span>Loading...</span>
        <span data-role="compile-time"></span>
      </div>
    </div>
  `

  const $ = (role: string) => container.querySelector(`[data-role="${role}"]`) as HTMLElement
  const loading = $('loading')
  const preview = $('preview') as HTMLIFrameElement
  const errorBar = $('error-bar')
  const statusEl = $('status')
  const compileTimeEl = $('compile-time')
  const consoleMessages = $('console-messages')
  const consoleClear = $('console-clear')
  const runBtn = $('run')
  const tabsContainer = $('tabs')
  const editorPanel = $('editor-panel')

  // Build tabs + editor mounts
  const hashData = loadFromHash()
  const editors: Record<string, any> = {}
  const mounts: Record<string, HTMLElement> = {}

  runner.tabs.forEach((tab, i) => {
    const tabBtn = document.createElement('button')
    tabBtn.className = 'tab'
    tabBtn.setAttribute('role', 'tab')
    tabBtn.setAttribute('aria-selected', String(i === 0))
    tabBtn.dataset.tab = tab.id
    tabBtn.textContent = tab.label
    tabsContainer.appendChild(tabBtn)

    const mount = document.createElement('div')
    mount.className = 'editor-mount'
    if (i !== 0) mount.hidden = true
    editorPanel.appendChild(mount)
    mounts[tab.id] = mount
  })

  // Schedule debounced run on edit
  let runTimer: ReturnType<typeof setTimeout> | undefined
  const scheduleRun = () => {
    clearTimeout(runTimer)
    runTimer = setTimeout(run, 500)
  }

  runner.tabs.forEach((tab) => {
    const initial = hashData?.[tab.id] ?? tab.default
    const langExt = languages[tab.lang]()
    const editor = new EditorView({
      doc: initial,
      extensions: [
        basicSetup,
        langExt,
        oneDark,
        EditorView.updateListener.of((update: any) => {
          if (update.docChanged) scheduleRun()
        }),
      ],
      parent: mounts[tab.id],
    })
    editors[tab.id] = editor
  })

  // Tab switching
  tabsContainer.querySelectorAll<HTMLButtonElement>('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab!
      tabsContainer.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', 'false'))
      btn.setAttribute('aria-selected', 'true')
      runner.tabs.forEach((tab) => {
        mounts[tab.id].hidden = tab.id !== target
      })
    })
  })

  // Console capture from iframe
  const addConsoleMsg = (text: string, level: 'log' | 'warn' | 'error' = 'log') => {
    const el = document.createElement('div')
    el.className =
      'console-msg' +
      (level === 'error' ? ' console-msg--error' : level === 'warn' ? ' console-msg--warn' : '')
    el.textContent = text
    consoleMessages.appendChild(el)
    consoleMessages.scrollTop = consoleMessages.scrollHeight
  }

  consoleClear.addEventListener('click', () => {
    consoleMessages.innerHTML = ''
  })

  window.addEventListener('message', (e) => {
    const data = e.data
    if (data?.type === 'console') {
      addConsoleMsg(data.args.join(' '), data.method)
    } else if (data?.type === 'error') {
      addConsoleMsg(data.message, 'error')
    }
  })

  // Status handling
  const setStatus = (status: RunnerStatus) => {
    const dotClass =
      status.state === 'ready' ? 'dot--ready' : status.state === 'error' ? 'dot--error' : 'dot--loading'
    statusEl.innerHTML = `<span class="dot ${dotClass}"></span>${status.label}`
    if (status.state === 'ready') loading.hidden = true
    if (status.state === 'error') loading.textContent = status.label
  }

  // Gather current file contents
  const collectFiles = (): Record<string, string> => {
    const files: Record<string, string> = {}
    runner.tabs.forEach((tab) => {
      files[tab.id] = editors[tab.id].state.doc.toString()
    })
    return files
  }

  // Run — build srcdoc and update iframe
  let ready = false
  const run = async () => {
    if (!ready) return
    const files = collectFiles()
    saveToHash(files)
    try {
      const { code, elapsedMs } = await runner.buildSrcdoc(files)
      compileTimeEl.textContent = `Ready in ${elapsedMs.toFixed(0)}ms`
      errorBar.hidden = true
      preview.srcdoc = code
    } catch (e: any) {
      compileTimeEl.textContent = 'Failed'
      errorBar.textContent = e?.message ?? String(e)
      errorBar.hidden = false
    }
  }

  runBtn.addEventListener('click', run)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      run()
    }
  })

  // Boot
  ;(async () => {
    try {
      await runner.init(setStatus)
      ready = true
      await run()
    } catch (e: any) {
      setStatus({ state: 'error', label: e?.message ?? 'Init failed' })
    }
  })()
}
