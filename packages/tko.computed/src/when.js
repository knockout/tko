
import {
  pureComputed
} from './computed'

export function when (predicate, callback, context) {
  const observable = pureComputed(predicate).extend({ notify: 'always' })
  const subscription = observable.subscribe(value => {
    if (value) {
      subscription.dispose()
      callback.call(context)
    }
  })
    // In case the initial value is true, process it right away
  observable.notifySubscribers(observable.peek())
  return subscription
}
