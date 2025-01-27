import { extenders as baseExtenders } from '@tko/observable'
import { computed } from './computed'


export function throttleExtender (target: any, timeout: number) {
    // Throttling means two things:

    // (1) For dependent observables, we throttle *evaluations* so that, no matter how fast its dependencies
    //     notify updates, the target doesn't re-evaluate (and hence doesn't notify) faster than a certain rate
  target.throttleEvaluation = timeout

    // (2) For writable targets (observables, or writable dependent observables), we throttle *writes*
    //     so the target cannot change value synchronously or faster than a certain rate
  var writeTimeoutInstance: ReturnType<typeof setTimeout> | undefined = undefined
  return computed({
    read: target,
    write: function (value) {
      clearTimeout(writeTimeoutInstance)
      writeTimeoutInstance = setTimeout(function () {
        target(value)
      }, timeout)
    }
  })
}

const extenders = baseExtenders;

extenders.throttle = throttleExtender
