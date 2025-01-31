//
// dependencyDetection
// ---
//
// In KO 3.x, dependencyDetection was also known as computedContext.
//
import { isSubscribable } from './subscribableSymbol'

const outerFrames = new Array()
let currentFrame
let lastId = 0

// Return a unique ID that can be assigned to an observable for dependency tracking.
// Theoretically, you could eventually overflow the number storage size, resulting
// in duplicate IDs. But in JavaScript, the largest exact integral value is 2^53
// or 9,007,199,254,740,992. If you created 1,000,000 IDs per second, it would
// take over 285 years to reach that number.
// Reference http://blog.vjeux.com/2010/javascript/javascript-max_int-number-limits.html
function getId () {
  return ++lastId
}

export function begin (options?) {
  outerFrames.push(currentFrame)
  currentFrame = options
}

export function end () {
  currentFrame = outerFrames.pop()
}

export function registerDependency (subscribable): void {
  if (currentFrame) {
    if (!isSubscribable(subscribable)) { throw new Error('Only subscribable things can act as dependencies') }
    currentFrame.callback.call(currentFrame.callbackTarget, subscribable, subscribable._id || (subscribable._id = getId()))
  }
}

export function ignore(
  callback: Function,
  callbackTarget?: any,
  callbackArgs?: any[]): any {
  try {
    begin()
    return callback.apply(callbackTarget, callbackArgs || [])
  } finally {
    end()
  }
}

export function getDependenciesCount(): number | undefined {
  if (currentFrame) {
    return currentFrame.computed.getDependenciesCount();
  }
}

export function getDependencies(): Subscribable[] | undefined{
  if (currentFrame) {
    return currentFrame.computed.getDependencies();
  }
}

export function isInitial(): boolean | undefined {
  if (currentFrame) {
    return currentFrame.isInitial;
  }
}

export { ignore as ignoreDependencies }
