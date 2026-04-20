import { cleanNode } from '@tko/utils'

const DELAY_MS = 25
const MAX_CLEAN_AT_ONCE = 1000
const cleanNodeQueue = new Array()
let cleanNodeTimeoutID: ReturnType<typeof setTimeout> | null = null

export function queueCleanNode(node) {
  cleanNodeQueue.push(node)
  triggerCleanTimeout()
}

function triggerCleanTimeout() {
  if (!cleanNodeTimeoutID && cleanNodeQueue.length) {
    cleanNodeTimeoutID = setTimeout(flushCleanQueue, DELAY_MS)
  }
}

function flushCleanQueue() {
  cleanNodeTimeoutID = null
  const nodes = cleanNodeQueue.splice(0, MAX_CLEAN_AT_ONCE)
  for (const node of nodes) {
    cleanNode(node)
  }
  triggerCleanTimeout()
}

// Drain the pending cleanup queue synchronously. Intended for test teardown:
// the default 25ms batch can otherwise fire after a test environment (e.g.
// happy-dom) has torn down DOM globals, producing spurious `Element is not
// defined` errors after the run has finished.
export function flushJsxCleanNow() {
  if (cleanNodeTimeoutID !== null) {
    clearTimeout(cleanNodeTimeoutID)
    cleanNodeTimeoutID = null
  }
  while (cleanNodeQueue.length) {
    const nodes = cleanNodeQueue.splice(0, MAX_CLEAN_AT_ONCE)
    for (const node of nodes) {
      cleanNode(node)
    }
  }
}
