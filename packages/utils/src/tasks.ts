//
//  Tasks Micro-scheduler
//  ===
//
/* eslint no-cond-assign: 0 */
import options from './options'
import { deferError } from './error'

let taskQueue = new Array(),
  taskQueueLength = 0,
  nextHandle = 1,
  nextIndexToProcess = 0

const schedulerGlobal = options.global

if (schedulerGlobal && typeof schedulerGlobal.queueMicrotask === 'function') {
  options.taskScheduler = callback => schedulerGlobal.queueMicrotask(callback)
} else if (schedulerGlobal?.MutationObserver && schedulerGlobal.document && !schedulerGlobal.navigator?.standalone) {
  options.taskScheduler = (function () {
    let scheduledCallback: null | (() => void) = null
    let toggle = false
    const div = schedulerGlobal.document.createElement('div')

    new schedulerGlobal.MutationObserver(function () {
      const callback = scheduledCallback
      scheduledCallback = null
      callback?.()
    }).observe(div, { attributes: true })

    return function (callback: () => void) {
      scheduledCallback = callback
      toggle = !toggle
      div.setAttribute('data-task-scheduler', toggle ? '1' : '0')
    }
  })()
} else {
  options.taskScheduler = callback => setTimeout(callback, 0)
}

function processTasks() {
  if (taskQueueLength) {
    // Each mark represents the end of a logical group of tasks and the number of these groups is
    // limited to prevent unchecked recursion.
    let mark = taskQueueLength,
      countMarks = 0

    // nextIndexToProcess keeps track of where we are in the queue; processTasks can be called recursively without issue
    for (let task; nextIndexToProcess < taskQueueLength; ) {
      if ((task = taskQueue[nextIndexToProcess++])) {
        if (nextIndexToProcess > mark) {
          if (++countMarks >= 5000) {
            nextIndexToProcess = taskQueueLength // skip all tasks remaining in the queue since any of them could be causing the recursion
            deferError(Error("'Too much recursion' after processing " + countMarks + ' task groups.'))
            break
          }
          mark = taskQueueLength
        }
        try {
          task()
        } catch (ex) {
          deferError(ex)
        }
      }
    }
  }
}

function scheduledProcess() {
  processTasks()

  // Reset the queue
  nextIndexToProcess = taskQueueLength = taskQueue.length = 0
}

function scheduleTaskProcessing() {
  options.taskScheduler(scheduledProcess)
}

export function schedule(func: () => any): number {
  if (!taskQueueLength) {
    scheduleTaskProcessing()
  }

  taskQueue[taskQueueLength++] = func
  return nextHandle++
}

export function cancel(handle: number) {
  const index = handle - (nextHandle - taskQueueLength)
  if (index >= nextIndexToProcess && index < taskQueueLength) {
    taskQueue[index] = null
  }
}

// For testing only: reset the queue and return the previous queue length
export function resetForTesting() {
  const length = taskQueueLength - nextIndexToProcess
  nextIndexToProcess = taskQueueLength = taskQueue.length = 0
  return length
}

export { processTasks as runEarly }
