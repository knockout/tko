import {
  cleanNode
} from '@tko/utils'

const DELAY_MS = 25
const MAX_CLEAN_AT_ONCE = 1000
const cleanNodeQueue = new Array()
let cleanNodeTimeoutID:NodeJS.Timeout|null = null

export function queueCleanNode (node) {
  cleanNodeQueue.push(node)
  triggerCleanTimeout()
}

function triggerCleanTimeout () {
  if (!cleanNodeTimeoutID && cleanNodeQueue.length) {
    cleanNodeTimeoutID = setTimeout(flushCleanQueue, DELAY_MS)
  }
}

function flushCleanQueue () {
  cleanNodeTimeoutID = null
  const nodes = cleanNodeQueue.splice(0, MAX_CLEAN_AT_ONCE)
  for (const node of nodes) { cleanNode(node) }
  triggerCleanTimeout()
}
