//
//  Tasks Micro-scheduler
//  ===
//
/* eslint no-cond-assign: 0 */
import options from './options';
import { deferError } from './error.js';

var taskQueue = [],
    taskQueueLength = 0,
    nextHandle = 1,
    nextIndexToProcess = 0;

if (window.MutationObserver && !(window.navigator && window.navigator.standalone)) {
    // Chrome 27+, Firefox 14+, IE 11+, Opera 15+, Safari 6.1+
    // From https://github.com/petkaantonov/bluebird * Copyright (c) 2014 Petka Antonov * License: MIT
    options.taskScheduler = (function (callback) {
        var div = document.createElement("div");
        new MutationObserver(callback).observe(div, {attributes: true});
        return function () { div.classList.toggle("foo"); };
    })(scheduledProcess);
} else if (document && "onreadystatechange" in document.createElement("script")) {
    // IE 6-10
    // From https://github.com/YuzuJS/setImmediate * Copyright (c) 2012 Barnesandnoble.com, llc, Donavon West, and Domenic Denicola * License: MIT
    options.taskScheduler = function (callback) {
        var script = document.createElement("script");
        script.onreadystatechange = function () {
            script.onreadystatechange = null;
            document.documentElement.removeChild(script);
            script = null;
            callback();
        };
        document.documentElement.appendChild(script);
    };
} else {
    options.taskScheduler = function (callback) {
        setTimeout(callback, 0);
    };
}

function processTasks() {
    if (taskQueueLength) {
        // Each mark represents the end of a logical group of tasks and the number of these groups is
        // limited to prevent unchecked recursion.
        var mark = taskQueueLength, countMarks = 0;

        // nextIndexToProcess keeps track of where we are in the queue; processTasks can be called recursively without issue
        for (var task; nextIndexToProcess < taskQueueLength; ) {
            if (task = taskQueue[nextIndexToProcess++]) {
                if (nextIndexToProcess > mark) {
                    if (++countMarks >= 5000) {
                        nextIndexToProcess = taskQueueLength;   // skip all tasks remaining in the queue since any of them could be causing the recursion
                        deferError(Error("'Too much recursion' after processing " + countMarks + " task groups."));
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
    options.taskScheduler(scheduledProcess);
}


export function schedule(func) {
    if (!taskQueueLength) {
        scheduleTaskProcessing();
    }

    taskQueue[taskQueueLength++] = func;
    return nextHandle++;
}

export function cancel(handle) {
    var index = handle - (nextHandle - taskQueueLength);
    if (index >= nextIndexToProcess && index < taskQueueLength) {
        taskQueue[index] = null;
    }
}

// For testing only: reset the queue and return the previous queue length
export function resetForTesting() {
    var length = taskQueueLength - nextIndexToProcess;
    nextIndexToProcess = taskQueueLength = taskQueue.length = 0;
    return length;
}

export {processTasks as runEarly};
