//
//  Defer Updates
//  ===
//
import { tasks } from '@tko/utils'

export function deferUpdates(target: any) {
  if (target._deferUpdates) { return }
  target._deferUpdates = true
  target.limit(function (callback) {
    let handle
    let ignoreUpdates = false
    return function () {
      if (!ignoreUpdates) {
        tasks.cancel(handle)
        handle = tasks.schedule(callback)
        try {
          ignoreUpdates = true
          target.notifySubscribers(undefined, 'dirty')
        } finally {
          ignoreUpdates = false
        }
      }
    }
  })
}
