//
// Observable Array - Change Tracking Extender
// ---
//
/* eslint no-fallthrough: 0 */

import {
    extend, compareArrays, findMovesInArrayComparison    
} from '@tko/utils'

import type { CompareArraysOptions } from '@tko/utils'

import { defaultEvent } from './subscribable'
import { extenders } from './extenders'
import type { ObservableArray } from './observableArray'

export var arrayChangeEventName = 'arrayChange'

export function trackArrayChanges (target: ObservableArray, options?: CompareArraysOptions) {
    // Use the provided options--each call to trackArrayChanges overwrites the previously set options
  target.compareArrayOptions = {}
  if (options && typeof options === 'object') {
    extend(target.compareArrayOptions, options)
  }
  target.compareArrayOptions.sparse = true

    // Only modify the target observable once
  if (target.cacheDiffForKnownOperation) {
    return
  }
  let trackingChanges = false
  let cachedDiff: any | null = null
  let arrayChangeSubscription
  let pendingNotifications = 0
  let underlyingNotifySubscribersFunction
  let underlyingBeforeSubscriptionAddFunction = target.beforeSubscriptionAdd
  let underlyingAfterSubscriptionRemoveFunction = target.afterSubscriptionRemove

    // Watch "subscribe" calls, and for array change events, ensure change tracking is enabled
  target.beforeSubscriptionAdd = function (event) {
    if (underlyingBeforeSubscriptionAddFunction) {
      underlyingBeforeSubscriptionAddFunction.call(target, event)
    }
    if (event === arrayChangeEventName) {
      trackChanges()
    }
  }

    // Watch "dispose" calls, and for array change events, ensure change tracking is disabled when all are disposed
  target.afterSubscriptionRemove = function (event) {
    if (underlyingAfterSubscriptionRemoveFunction) {
      underlyingAfterSubscriptionRemoveFunction.call(target, event)
    }
    if (event === arrayChangeEventName && !target.hasSubscriptionsForEvent(arrayChangeEventName)) {
      if (underlyingNotifySubscribersFunction) {
        target.notifySubscribers = underlyingNotifySubscribersFunction
        underlyingNotifySubscribersFunction = undefined
      }
      if (arrayChangeSubscription) {
        arrayChangeSubscription.dispose()
      }
      arrayChangeSubscription = null
      trackingChanges = false
    }
  }

  function trackChanges () {
        // Calling 'trackChanges' multiple times is the same as calling it once
    if (trackingChanges) {
      return
    }

    trackingChanges = true

        // Intercept "notifySubscribers" to track how many times it was called.
    underlyingNotifySubscribersFunction = target['notifySubscribers']
    target.notifySubscribers = function (valueToNotify, event) {
      if (!event || event === defaultEvent) {
        ++pendingNotifications
      }
      return underlyingNotifySubscribersFunction.apply(this, arguments)
    }

        // Each time the array changes value, capture a clone so that on the next
        // change it's possible to produce a diff
    var previousContents = new Array().concat(target.peek() === undefined ? [] : target.peek())
    cachedDiff = null
    arrayChangeSubscription = target.subscribe(function (currentContents) {
      let changes
            // Make a copy of the current contents and ensure it's an array
      currentContents = new Array().concat(currentContents || [])

            // Compute the diff and issue notifications, but only if someone is listening
      if (target.hasSubscriptionsForEvent(arrayChangeEventName)) {
        changes = getChanges(previousContents, currentContents)
      }

            // Eliminate references to the old, removed items, so they can be GCed
      previousContents = currentContents
      cachedDiff = null
      pendingNotifications = 0

      if (changes && changes.length) {
        target.notifySubscribers(changes, arrayChangeEventName)
      }
    })
  }

  function getChanges (previousContents, currentContents) {
        // We try to re-use cached diffs.
        // The scenarios where pendingNotifications > 1 are when using rate-limiting or the Deferred Updates
        // plugin, which without this check would not be compatible with arrayChange notifications. Normally,
        // notifications are issued immediately so we wouldn't be queueing up more than one.
    if (!cachedDiff || pendingNotifications > 1) {
      cachedDiff = trackArrayChanges.compareArrays(previousContents, currentContents, target.compareArrayOptions)
    }

    return cachedDiff
  }

  target.cacheDiffForKnownOperation = function (rawArray, operationName, args) {
      // Only run if we're currently tracking changes for this observable array
      // and there aren't any pending deferred notifications.
    if (!trackingChanges || pendingNotifications) {
      return
    }
    var diff = new Array(),
      arrayLength = rawArray.length,
      argsLength = args.length,
      offset = 0

    function pushDiff (status, value, index) {
      return diff[diff.length] = { 'status': status, 'value': value, 'index': index }
    }
    switch (operationName) {
      case 'push':
        offset = arrayLength
      case 'unshift':
        for (let index = 0; index < argsLength; index++) {
          pushDiff('added', args[index], offset + index)
        }
        break

      case 'pop':
        offset = arrayLength - 1
      case 'shift':
        if (arrayLength) {
          pushDiff('deleted', rawArray[offset], offset)
        }
        break

      case 'splice':
            // Negative start index means 'from end of array'. After that we clamp to [0...arrayLength].
            // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
        var startIndex = Math.min(Math.max(0, args[0] < 0 ? arrayLength + args[0] : args[0]), arrayLength),
          endDeleteIndex = argsLength === 1 ? arrayLength : Math.min(startIndex + (args[1] || 0), arrayLength),
          endAddIndex = startIndex + argsLength - 2,
          endIndex = Math.max(endDeleteIndex, endAddIndex),
          additions = new Array(), deletions = new Array()
        for (let index = startIndex, argsIndex = 2; index < endIndex; ++index, ++argsIndex) {
          if (index < endDeleteIndex) { deletions.push(pushDiff('deleted', rawArray[index], index)) }
          if (index < endAddIndex) { additions.push(pushDiff('added', args[argsIndex], index)) }
        }
        findMovesInArrayComparison(deletions, additions)
        break

      default:
        return
    }
    cachedDiff = diff
  }
}

// Expose compareArrays for testing.
trackArrayChanges.compareArrays = compareArrays;

// Add the trackArrayChanges extender so we can use
// obs.extend({ trackArrayChanges: true })
extenders.trackArrayChanges = trackArrayChanges
