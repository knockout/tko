export type EditorLang = 'html' | 'tsx' | 'js'

export interface RunnerTab {
  id: string
  label: string
  lang: EditorLang
  default: string
}

export type RunnerState = 'loading' | 'ready' | 'error'

export interface RunnerStatus {
  state: RunnerState
  label: string
}

export interface Runner {
  title: string
  tabs: RunnerTab[]
  init(onStatus: (status: RunnerStatus) => void): Promise<void>
  buildSrcdoc(files: Record<string, string>): Promise<{ code: string; elapsedMs: number }>
}
