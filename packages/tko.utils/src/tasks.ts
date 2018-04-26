//
//  Tasks Micro-scheduler
//  ===
//
/* eslint no-cond-assign: 0 */
import options from './options';
import { deferError } from './error';

// tslint:disable:ban-types
type Task = Function;

const taskQueue: Array<Task|null> = [], w = options.global;
let taskQueueLength = 0,
  nextHandle = 1,
  nextIndexToProcess = 0;

if (w && (w as any).MutationObserver && !(w.navigator && (w.navigator as any).standalone)) {
    // Chrome 27+, Firefox 14+, IE 11+, Opera 15+, Safari 6.1+, node
    // From https://github.com/petkaantonov/bluebird * Copyright (c) 2014 Petka Antonov * License: MIT
  options.taskScheduler = ((callback: Function) => {
    const div = w.document.createElement('div');
    new MutationObserver(callback as MutationCallback).observe(div, {attributes: true});
    return () => { div.classList.toggle('foo'); };
  })(scheduledProcess);
} else if (w && w.document && 'onreadystatechange' in w.document.createElement('script')) {
    // IE 6-10
    // From https://github.com/YuzuJS/setImmediate * Copyright (c) 2012 Barnesandnoble.com, llc, Donavon West, and Domenic Denicola * License: MIT
  options.taskScheduler = (callback: Function) => {
    let script: HTMLScriptElement|null = document.createElement('script');
    (script as any).onreadystatechange = () => {
      (script as any).onreadystatechange = null;
      document.documentElement.removeChild(script!);
      script = null;
      callback();
    };

    document.documentElement.appendChild(script);
  };
} else {
  options.taskScheduler = (callback: Function) => {
    setTimeout(callback, 0);
  };
}

function processTasks() {
  if (taskQueueLength) {
        // Each mark represents the end of a logical group of tasks and the number of these groups is
        // limited to prevent unchecked recursion.
    let mark = taskQueueLength, countMarks = 0;

        // nextIndexToProcess keeps track of where we are in the queue; processTasks can be called recursively without issue
    for (let task; nextIndexToProcess < taskQueueLength;) {
      if (task = taskQueue[nextIndexToProcess++]) {
        if (nextIndexToProcess > mark) {
          if (++countMarks >= 5000) {
            nextIndexToProcess = taskQueueLength;   // skip all tasks remaining in the queue since any of them could be causing the recursion
            deferError(Error("'Too much recursion' after processing " + countMarks + ' task groups.'));
            break;
          }
          mark = taskQueueLength;
        }
        try {
          task();
        } catch (ex) {
          deferError(ex);
        }
      }
    }
  }
}

function scheduledProcess() {
  processTasks();

    // Reset the queue
  nextIndexToProcess = taskQueueLength = taskQueue.length = 0;
}

function scheduleTaskProcessing() {
  options.taskScheduler!(scheduledProcess);
}

export type TaskHandle = number;

export function schedule(func: Function): TaskHandle {
  if (!taskQueueLength) {
    scheduleTaskProcessing();
  }

  taskQueue[taskQueueLength++] = func;
  return nextHandle++;
}

export function cancel(handle: TaskHandle) {
  const index = handle - (nextHandle - taskQueueLength);
  if (index >= nextIndexToProcess && index < taskQueueLength) {
    taskQueue[index] = null;
  }
}

// For testing only: reset the queue and return the previous queue length
export function resetForTesting() {
  const length = taskQueueLength - nextIndexToProcess;
  nextIndexToProcess = taskQueueLength = taskQueue.length = 0;
  return length;
}

export {processTasks as runEarly};
