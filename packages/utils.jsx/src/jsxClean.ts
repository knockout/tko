import { cleanNode, options } from '@tko/utils'

const DELAY_MS = 25
const cleanNodeQueue = new Array()
let cleanNodeTimeoutID: ReturnType<typeof setTimeout> | null = null

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
  while (cleanNodeQueue.length) {
    const nodes = cleanNodeQueue.splice(0, cleanNodeQueue.length)
    for (const node of nodes) {
      cleanNode(node)
    }
  }
}
