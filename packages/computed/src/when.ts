import { pureComputed } from './computed'

function kowhen(predicate, context, resolve) {
  const observable = pureComputed(predicate, context).extend({ notify: 'always' })
  const subscription = observable.subscribe(value => {
    if (value) {
      subscription.dispose()
      resolve(value)
    }
  })
  // In case the initial value is true, process it right away
  observable.notifySubscribers(observable.peek())
  return subscription
}

export function when(predicate, callback, context) {
  const whenFn = kowhen.bind(null, predicate, context)
  return callback ? whenFn(callback.bind(context)) : new Promise(whenFn)
}
