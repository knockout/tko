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

function drainBatch() {
  const nodes = cleanNodeQueue.splice(0, MAX_CLEAN_AT_ONCE)
  for (const node of nodes) {
    cleanNode(node)
  }
}

function flushCleanQueue() {
  cleanNodeTimeoutID = null
  drainBatch()
  triggerCleanTimeout()
}

// Drain the pending cleanup queue synchronously. Safe to call in any
// environment; useful for test teardown where the default 25ms batch can
// otherwise fire after the test runtime has torn down DOM globals.
export function flushJsxCleanNow() {
  if (cleanNodeTimeoutID !== null) {
    clearTimeout(cleanNodeTimeoutID)
    cleanNodeTimeoutID = null
  }
  while (cleanNodeQueue.length) {
    drainBatch()
  }
}
