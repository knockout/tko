//
// Computed Observable Values
//
// (before tko, `computed` was also known as `dependentObservable`)
//
import {
  addDisposeCallback,
  arrayForEach,
  createSymbolOrString,
  domNodeIsAttachedToDocument,
  extend,
  options,
  hasOwnProperty,
  objectForEach,
  options as koOptions,
  removeDisposeCallback,
  safeSetTimeout
} from '@tko/utils'

import {
  dependencyDetection,
  extenders,
  valuesArePrimitiveAndEqual,
  observable,
  subscribable,
  LATEST_VALUE
} from '@tko/observable'

import type { Observable, Subscribable } from '@tko/observable'

const computedState: symbol = createSymbolOrString('_state')
const DISPOSED_STATE = {
  dependencyTracking: null,
  dependenciesCount: 0,
  isDisposed: true,
  isStale: false,
  isDirty: false,
  isSleeping: false,
  disposeWhenNodeIsRemoved: null,
  readFunction: null,
  _options: null
}

export interface Computed<T = any> extends ComputedFunctions<T> {
  (): T
  (value: T): this
}

export interface ComputedFunctions<T = any> extends Subscribable<T> {
  // It's possible for a to be undefined, since the equalityComparer is run on the initial
  // computation with undefined as the first argument. This is user-relevant for deferred computeds.
  equalityComparer(a: T | undefined, b: T): boolean
  peek(): T
  dispose(): void
  isActive(): boolean
  getDependenciesCount(): number
  getDependencies(): Subscribable[]
}

// used in computed, but empty interface is pointless. Check if it's needed
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PureComputed<T = any> extends Computed<T> {}

export type ComputedReadFunction<T = any, TTarget = void> =
  | Subscribable<T>
  | Observable<T>
  | Computed<T>
  | ((this: TTarget) => T)
export type ComputedWriteFunction<T = any, TTarget = void> = (this: TTarget, val: T) => void
export type MaybeComputed<T = any> = T | Computed<T>

export interface ComputedOptions<T = any, TTarget = void> {
  read?: ComputedReadFunction<T, TTarget>
  write?: ComputedWriteFunction<T, TTarget>
  owner?: TTarget
  pure?: boolean
  deferEvaluation?: boolean
  disposeWhenNodeIsRemoved?: Node
  disposeWhen?: () => boolean
}

interface State {
  latestValue?: any
  isStale: boolean
  isDirty: boolean
  isBeingEvaluated: boolean
  suppressDisposalUntilDisposeWhenReturnsFalse: boolean
  isDisposed: boolean
  pure: boolean
  isSleeping: boolean
  readFunction: ComputedReadFunction
  evaluatorFunctionTarget: any
  disposeWhenNodeIsRemoved: Node | null
  disposeWhen?: () => boolean
  domNodeDisposalCallback: (() => void) | null
  dependencyTracking: any
  dependenciesCount: number
  evaluationTimeoutInstance: any
}

export function computed(
  evaluatorFunctionOrOptions?: ComputedOptions<any, void> | ComputedReadFunction<any, any>,
  evaluatorFunctionTarget?: any,
  options?: ComputedOptions
): Computed {
  if (typeof evaluatorFunctionOrOptions === 'object') {
    // Single-parameter syntax - everything is on this "options" param
    options = evaluatorFunctionOrOptions as ComputedOptions
  } else {
    // Multi-parameter syntax - construct the options according to the params passed
    options = options || {}
    if (evaluatorFunctionOrOptions) {
      options!.read = evaluatorFunctionOrOptions
    }
  }
  if (typeof options?.read !== 'function') {
    throw Error('Pass a function that returns the value of the computed')
  }

  const writeFunction = options.write
  const state: State = {
    latestValue: undefined,
    isStale: true,
    isDirty: true,
    isBeingEvaluated: false,
    suppressDisposalUntilDisposeWhenReturnsFalse: false,
    isDisposed: false,
    pure: false,
    isSleeping: false,
    readFunction: options.read,
    evaluatorFunctionTarget: evaluatorFunctionTarget || options.owner,
    disposeWhenNodeIsRemoved: options.disposeWhenNodeIsRemoved || null,
    disposeWhen: options.disposeWhen,
    domNodeDisposalCallback: null,
    dependencyTracking: {},
    dependenciesCount: 0,
    evaluationTimeoutInstance: null
  }

  function computedObservable() {
    if (arguments.length > 0) {
      if (typeof writeFunction === 'function') {
        // Writing a value
        writeFunction.apply(state.evaluatorFunctionTarget, arguments as any)
      } else {
        throw new Error(
          "Cannot write a value to a computed unless you specify a 'write' option. If you wish to read the current value, don't pass any parameters."
        )
      }
      return this // Permits chained assignments
    } else {
      // Reading the value
      if (!state.isDisposed) {
        dependencyDetection.registerDependency(computedObservable)
      }
      if (state.isDirty || (state.isSleeping && (computedObservable as any).haveDependenciesChanged())) {
        ;(computedObservable as any).evaluateImmediate()
      }
      return state.latestValue
    }
  }

  computedObservable[computedState] = state
  computedObservable.isWriteable = typeof writeFunction === 'function'

  subscribable.fn.init(computedObservable)

  // Inherit from 'computed'
  Object.setPrototypeOf(computedObservable, computed.fn)

  if (options.pure) {
    state.pure = true
    state.isSleeping = true // Starts off sleeping; will awake on the first subscription
    extend(computedObservable, pureComputedOverrides)
  } else if (options.deferEvaluation) {
    extend(computedObservable, deferEvaluationOverrides)
  }

  if (koOptions.deferUpdates) {
    extenders.deferred(computedObservable, true)
  }

  if (koOptions.debug) {
    // #1731 - Aid debugging by exposing the computed's options
    computedObservable._options = options
  }

  if (state.disposeWhenNodeIsRemoved) {
    // Since this computed is associated with a DOM node, and we don't want to dispose the computed
    // until the DOM node is *removed* from the document (as opposed to never having been in the document),
    // we'll prevent disposal until "disposeWhen" first returns false.
    state.suppressDisposalUntilDisposeWhenReturnsFalse = true

    // disposeWhenNodeIsRemoved: true can be used to opt into the "only dispose after first false result"
    // behavior even if there's no specific node to watch. In that case, clear the option so we don't try
    // to watch for a non-node's disposal. This technique is intended for KO's internal use only and shouldn't
    // be documented or used by application code, as it's likely to change in a future version of KO.
    if (!state.disposeWhenNodeIsRemoved.nodeType) {
      state.disposeWhenNodeIsRemoved = null
    }
  }

  // Evaluate, unless sleeping or deferEvaluation is true
  if (!state.isSleeping && !options.deferEvaluation) {
    ;(computedObservable as any).evaluateImmediate()
  }

  // Attach a DOM node disposal callback so that the computed will be proactively disposed as soon as the node is
  // removed using ko.removeNode. But skip if isActive is false (there will never be any dependencies to dispose).
  if (state.disposeWhenNodeIsRemoved && (computedObservable as any).isActive()) {
    addDisposeCallback(
      state.disposeWhenNodeIsRemoved,
      (state.domNodeDisposalCallback = function () {
        ;(computedObservable as any).dispose()
      })
    )
  }

  return computedObservable as unknown as Computed
}

// Utility function that disposes a given dependencyTracking entry
function computedDisposeDependencyCallback(id, entryToDispose) {
  if (entryToDispose !== null && entryToDispose.dispose) {
    entryToDispose.dispose()
  }
}

// This function gets called each time a dependency is detected while evaluating a computed.
// It's factored out as a shared function to avoid creating unnecessary function instances during evaluation.
function computedBeginDependencyDetectionCallback(subscribable, id) {
  const computedObservable = this.computedObservable,
    state = computedObservable[computedState]
  if (!state.isDisposed) {
    if (this.disposalCount && this.disposalCandidates[id]) {
      // Don't want to dispose this subscription, as it's still being used
      computedObservable.addDependencyTracking(id, subscribable, this.disposalCandidates[id])
      this.disposalCandidates[id] = null // No need to actually delete the property - disposalCandidates is a transient object anyway
      --this.disposalCount
    } else if (!state.dependencyTracking[id]) {
      // Brand new subscription - add it
      computedObservable.addDependencyTracking(
        id,
        subscribable,
        state.isSleeping ? { _target: subscribable } : computedObservable.subscribeToDependency(subscribable)
      )
    }
    // If the observable we've accessed has a pending notification, ensure
    // we get notified of the actual final value (bypass equality checks)
    if (subscribable._notificationIsPending) {
      subscribable._notifyNextChangeIfValueIsDifferent()
    }
  }
}

computed.fn = {
  equalityComparer: valuesArePrimitiveAndEqual,
  getDependenciesCount(): number {
    return this[computedState].dependenciesCount
  },

  getDependencies() {
    const dependencyTracking = this[computedState].dependencyTracking
    const dependentObservables = new Array()

    objectForEach(dependencyTracking, function (id, dependency) {
      dependentObservables[dependency._order] = dependency._target
    })

    return dependentObservables
  },

  addDependencyTracking(id, target, trackingObj) {
    if (this[computedState].pure && target === this) {
      throw Error("A 'pure' computed must not be called recursively")
    }

    this[computedState].dependencyTracking[id] = trackingObj
    trackingObj._order = this[computedState].dependenciesCount++
    trackingObj._version = target.getVersion()
  },
  haveDependenciesChanged() {
    let id,
      dependency,
      dependencyTracking = this[computedState].dependencyTracking
    for (id in dependencyTracking) {
      if (hasOwnProperty(dependencyTracking, id)) {
        dependency = dependencyTracking[id]
        if (
          (this._evalDelayed && dependency._target._notificationIsPending)
          || dependency._target.hasChanged(dependency._version)
        ) {
          return true
        }
      }
    }
    return false
  },
  markDirty() {
    // Process "dirty" events if we can handle delayed notifications
    if (this._evalDelayed && !this[computedState].isBeingEvaluated) {
      this._evalDelayed(false /* notifyChange */)
    }
  },
  isActive() {
    const state = this[computedState]
    return state.isDirty || state.dependenciesCount > 0
  },
  respondToChange() {
    // Ignore "change" events if we've already scheduled a delayed notification
    if (!this._notificationIsPending) {
      this.evaluatePossiblyAsync()
    } else if (this[computedState].isDirty) {
      this[computedState].isStale = true
    }
  },
  subscribeToDependency(target) {
    if (target._deferUpdates) {
      const dirtySub = target.subscribe(this.markDirty, this, 'dirty'),
        changeSub = target.subscribe(this.respondToChange, this)
      return {
        _target: target,
        dispose() {
          dirtySub.dispose()
          changeSub.dispose()
        }
      }
    } else {
      return target.subscribe(this.evaluatePossiblyAsync, this)
    }
  },
  evaluatePossiblyAsync() {
    const computedObservable = this,
      throttleEvaluationTimeout = computedObservable.throttleEvaluation
    if (throttleEvaluationTimeout && throttleEvaluationTimeout >= 0) {
      clearTimeout(this[computedState].evaluationTimeoutInstance)
      this[computedState].evaluationTimeoutInstance = safeSetTimeout(function () {
        computedObservable.evaluateImmediate(true /* notifyChange */)
      }, throttleEvaluationTimeout)
    } else if (computedObservable._evalDelayed) {
      computedObservable._evalDelayed(true /* notifyChange */)
    } else {
      computedObservable.evaluateImmediate(true /* notifyChange */)
    }
  },
  evaluateImmediate(notifyChange) {
    let computedObservable = this,
      state = computedObservable[computedState],
      disposeWhen = state.disposeWhen,
      changed = false

    if (state.isBeingEvaluated) {
      // If the evaluation of a ko.computed causes side effects, it's possible that it will trigger its own re-evaluation.
      // This is not desirable (it's hard for a developer to realise a chain of dependencies might cause this, and they almost
      // certainly didn't intend infinite re-evaluations). So, for predictability, we simply prevent ko.computeds from causing
      // their own re-evaluation. Further discussion at https://github.com/SteveSanderson/knockout/pull/387
      return
    }

    // Do not evaluate (and possibly capture new dependencies) if disposed
    if (state.isDisposed) {
      return
    }

    if (
      (state.disposeWhenNodeIsRemoved && !domNodeIsAttachedToDocument(state.disposeWhenNodeIsRemoved))
      || (disposeWhen && disposeWhen())
    ) {
      // See comment above about suppressDisposalUntilDisposeWhenReturnsFalse
      if (!state.suppressDisposalUntilDisposeWhenReturnsFalse) {
        computedObservable.dispose()
        return
      }
    } else {
      // It just did return false, so we can stop suppressing now
      state.suppressDisposalUntilDisposeWhenReturnsFalse = false
    }

    state.isBeingEvaluated = true
    try {
      changed = this.evaluateImmediate_CallReadWithDependencyDetection(notifyChange)
    } finally {
      state.isBeingEvaluated = false
    }

    return changed
  },
  evaluateImmediate_CallReadWithDependencyDetection(notifyChange) {
    // This function is really just part of the evaluateImmediate logic. You would never call it from anywhere else.
    // Factoring it out into a separate function means it can be independent of the try/catch block in evaluateImmediate,
    // which contributes to saving about 40% off the CPU overhead of computed evaluation (on V8 at least).

    let computedObservable = this,
      state = computedObservable[computedState],
      changed = false

    // Initially, we assume that none of the subscriptions are still being used (i.e., all are candidates for disposal).
    // Then, during evaluation, we cross off any that are in fact still being used.
    const isInitial = state.pure ? undefined : !state.dependenciesCount, // If we're evaluating when there are no previous dependencies, it must be the first time
      dependencyDetectionContext = {
        computedObservable: computedObservable,
        disposalCandidates: state.dependencyTracking,
        disposalCount: state.dependenciesCount
      }

    dependencyDetection.begin({
      callbackTarget: dependencyDetectionContext,
      callback: computedBeginDependencyDetectionCallback,
      computed: computedObservable,
      isInitial: isInitial
    })

    state.dependencyTracking = {}
    state.dependenciesCount = 0

    const newValue = this.evaluateImmediate_CallReadThenEndDependencyDetection(state, dependencyDetectionContext)

    if (!state.dependenciesCount) {
      computedObservable.dispose()
      changed = true // When evaluation causes a disposal, make sure all dependent computeds get notified so they'll see the new state
    } else {
      changed = computedObservable.isDifferent(state.latestValue, newValue)
    }

    if (changed) {
      if (!state.isSleeping) {
        computedObservable.notifySubscribers(state.latestValue, 'beforeChange')
      } else {
        computedObservable.updateVersion()
      }

      state.latestValue = newValue
      if (options.debug) {
        computedObservable._latestValue = newValue
      }

      computedObservable.notifySubscribers(state.latestValue, 'spectate')

      if (!state.isSleeping && notifyChange) {
        computedObservable.notifySubscribers(state.latestValue)
      }

      if (computedObservable._recordUpdate) {
        computedObservable._recordUpdate()
      }
    }

    if (isInitial) {
      computedObservable.notifySubscribers(state.latestValue, 'awake')
    }

    return changed
  },
  evaluateImmediate_CallReadThenEndDependencyDetection(state, dependencyDetectionContext) {
    // This function is really part of the evaluateImmediate_CallReadWithDependencyDetection logic.
    // You'd never call it from anywhere else. Factoring it out means that evaluateImmediate_CallReadWithDependencyDetection
    // can be independent of try/finally blocks, which contributes to saving about 40% off the CPU
    // overhead of computed evaluation (on V8 at least).

    try {
      const readFunction = state.readFunction
      return state.evaluatorFunctionTarget ? readFunction.call(state.evaluatorFunctionTarget) : readFunction()
    } finally {
      dependencyDetection.end()

      // For each subscription no longer being used, remove it from the active subscriptions list and dispose it
      if (dependencyDetectionContext.disposalCount && !state.isSleeping) {
        objectForEach(dependencyDetectionContext.disposalCandidates, computedDisposeDependencyCallback)
      }

      state.isStale = state.isDirty = false
    }
  },
  peek(forceEvaluate) {
    // Peek won't ordinarily re-evaluate, except while the computed is sleeping
    //  or to get the initial value when "deferEvaluation" is set.
    const state = this[computedState]
    if (
      (state.isDirty && (forceEvaluate || !state.dependenciesCount))
      || (state.isSleeping && this.haveDependenciesChanged())
    ) {
      this.evaluateImmediate()
    }
    return state.latestValue
  },

  get [LATEST_VALUE]() {
    return this.peek()
  },

  limit(limitFunction) {
    const state = this[computedState]
    // Override the limit function with one that delays evaluation as well
    ;(subscribable.fn as any).limit.call(this, limitFunction)
    Object.assign(this, {
      _evalIfChanged() {
        if (!this[computedState].isSleeping) {
          if (this[computedState].isStale) {
            this.evaluateImmediate()
          } else {
            this[computedState].isDirty = false
          }
        }
        return state.latestValue
      },
      _evalDelayed(isChange) {
        this._limitBeforeChange(state.latestValue)

        // Mark as dirty
        state.isDirty = true
        if (isChange) {
          state.isStale = true
        }

        // Pass the observable to the "limit" code, which will evaluate it when
        // it's time to do the notification.
        this._limitChange(this, !isChange /* isDirty */)
      }
    })
  },
  dispose() {
    const state = this[computedState]
    if (!state.isSleeping && state.dependencyTracking) {
      objectForEach(state.dependencyTracking, function (id, dependency) {
        if (dependency.dispose) {
          dependency.dispose()
        }
      })
    }
    if (state.disposeWhenNodeIsRemoved && state.domNodeDisposalCallback) {
      removeDisposeCallback(state.disposeWhenNodeIsRemoved, state.domNodeDisposalCallback)
    }
    Object.assign(state, DISPOSED_STATE)
  }
}

const pureComputedOverrides = {
  beforeSubscriptionAdd(event: string) {
    // If asleep, wake up the computed by subscribing to any dependencies.
    const computedObservable = this,
      state = computedObservable[computedState]
    if (!state.isDisposed && state.isSleeping && event === 'change') {
      state.isSleeping = false
      if (state.isStale || computedObservable.haveDependenciesChanged()) {
        state.dependencyTracking = null
        state.dependenciesCount = 0
        if (computedObservable.evaluateImmediate()) {
          computedObservable.updateVersion()
        }
      } else {
        // First put the dependencies in order
        const dependenciesOrder = new Array()
        objectForEach(state.dependencyTracking, function (id, dependency) {
          dependenciesOrder[dependency._order] = id
        })
        // Next, subscribe to each one
        arrayForEach(dependenciesOrder, function (id, order) {
          const dependency = state.dependencyTracking[id],
            subscription = computedObservable.subscribeToDependency(dependency._target)
          subscription._order = order
          subscription._version = dependency._version
          state.dependencyTracking[id] = subscription
        })

        // Waking dependencies may have triggered effects
        if (computedObservable.haveDependenciesChanged()) {
          if (computedObservable.evaluateImmediate()) {
            computedObservable.updateVersion()
          }
        }
      }

      if (!state.isDisposed) {
        // test since evaluating could trigger disposal
        computedObservable.notifySubscribers(state.latestValue, 'awake')
      }
    }
  },
  afterSubscriptionRemove(event: string) {
    const state = this[computedState]
    if (!state.isDisposed && event === 'change' && !this.hasSubscriptionsForEvent('change')) {
      objectForEach(state.dependencyTracking, function (id, dependency) {
        if (dependency.dispose) {
          state.dependencyTracking[id] = {
            _target: dependency._target,
            _order: dependency._order,
            _version: dependency._version
          }
          dependency.dispose()
        }
      })
      state.isSleeping = true
      this.notifySubscribers(undefined, 'asleep')
    }
  },
  getVersion() {
    // Because a pure computed is not automatically updated while it is sleeping, we can't
    // simply return the version number. Instead, we check if any of the dependencies have
    // changed and conditionally re-evaluate the computed observable.
    const state = this[computedState]
    if (state.isSleeping && (state.isStale || this.haveDependenciesChanged())) {
      this.evaluateImmediate()
    }
    return subscribable.fn.getVersion.call(this)
  }
}

const deferEvaluationOverrides = {
  beforeSubscriptionAdd(event) {
    // This will force a computed with deferEvaluation to evaluate when the first subscription is registered.
    if (event === 'change' || event === 'beforeChange') {
      this.peek()
    }
  }
}

Object.setPrototypeOf(computed.fn, subscribable.fn)

// Set the proto values for ko.computed
const protoProp = observable.protoProperty // == "__ko_proto__"
computed.fn[protoProp] = computed

/* This is used by ko.isObservable */
observable.observablePrototypes.add(computed as any)

export function isComputed<T = any>(instance: any): instance is Computed<T> {
  return typeof instance === 'function' && instance[protoProp] === computed
}

export function isPureComputed<T = any>(instance: any): instance is PureComputed<T> {
  return isComputed(instance) && instance[computedState] && (instance[computedState] as unknown as State).pure
}

export function pureComputed<T = any>(
  evaluatorFunctionOrOptions: ComputedOptions | ComputedReadFunction,
  evaluatorFunctionTarget?
): Computed<T> {
  if (typeof evaluatorFunctionOrOptions === 'function') {
    const evaluator = evaluatorFunctionOrOptions as ComputedReadFunction
    return computed(evaluator, evaluatorFunctionTarget, { pure: true })
  } else {
    let options = evaluatorFunctionOrOptions as ComputedOptions
    options = extend({}, options) // make a copy of the parameter object
    options.pure = true
    return computed(options, evaluatorFunctionTarget)
  }
}
