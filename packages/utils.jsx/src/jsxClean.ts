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

/**
 * Register jsxCleanBatchSize: the maximum number of JSX nodes to clean per
 * 25ms batch tick. Set to `0` to disable batching entirely — JSX node
 * cleanup then runs synchronously on detach. Useful in test environments
 * that tear down DOM globals between files, where a pending 25ms timer
 * can fire against a dead global and throw.
 */
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
