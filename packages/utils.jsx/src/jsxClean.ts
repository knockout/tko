import { cleanNode, defineOption, options } from '@tko/utils'

const DELAY_MS = 25
const cleanNodeQueue = new Array()
let cleanNodeTimeoutID: ReturnType<typeof setTimeout> | null = null

// Extend the Options type so ko.options.jsxCleanBatchSize is strongly typed.
declare module '@tko/utils' {
  interface Options {
    jsxCleanBatchSize: number
  }
}

// `0` runs cleanup synchronously on detach. Test environments that tear
// down DOM globals between files use that to avoid a pending 25ms timer
// firing against a dead global.
defineOption('jsxCleanBatchSize', { default: 1000 })

export function queueCleanNode(node) {
  cleanNodeQueue.push(node)
  if (options.jsxCleanBatchSize === 0) {
    flushAll()
  } else {
    scheduleBatch()
  }
}

function scheduleBatch() {
  if (!cleanNodeTimeoutID && cleanNodeQueue.length) {
    cleanNodeTimeoutID = setTimeout(flushBatch, DELAY_MS)
  }
}

function flushBatch() {
  cleanNodeTimeoutID = null
  // If the option was flipped to 0 (or below) while the timer was pending,
  // fall through to synchronous drain. Otherwise splice(0, 0) would remove
  // nothing and scheduleBatch would re-arm the timer every 25ms forever.
  if (options.jsxCleanBatchSize <= 0) {
    flushAll()
    return
  }
  const nodes = cleanNodeQueue.splice(0, options.jsxCleanBatchSize)
  for (const node of nodes) {
    cleanNode(node)
  }
  scheduleBatch()
}

function flushAll() {
  if (cleanNodeTimeoutID !== null) {
    clearTimeout(cleanNodeTimeoutID)
    cleanNodeTimeoutID = null
  }
  // Outer `while` is for re-enqueues triggered by cleanNode side effects.
  while (cleanNodeQueue.length) {
    for (const node of cleanNodeQueue.splice(0)) {
      cleanNode(node)
    }
  }
}
