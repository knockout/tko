//
// Computed Observable Values
//
// (before tko, `computed` was also known as `dependentObservable`)
//
import {
    addDisposeCallback,
    arrayForEach,
    domNodeIsAttachedToDocument,
    extend,
    options,
    hasOwnProperty,
    objectForEach,
    options as koOptions,
    removeDisposeCallback,
    safeSetTimeout,
} from '@tko/utils'

import {
    dependencyDetection,
    extenders,
    valuesArePrimitiveAndEqual,
    observable,
    subscribable,
    LATEST_VALUE
} from '@tko/observable'

import type { ProtoProperty } from '@tko/utils/src/options'

const computedState = Symbol('TKO Computed state')
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
} as const


function initialState<T> (options: ReadonlyComputedDefine<T>) {
  return {
    latestValue: undefined,
    isStale: true,
    isDirty: true,
    isBeingEvaluated: false,
    suppressDisposalUntilDisposeWhenReturnsFalse: false,
    isDisposed: false,
    pure: false,
    isSleeping: false,
    readFunction: options.read,
    evaluatorFunctionTarget: options.owner,
    disposeWhenNodeIsRemoved: options.disposeWhenNodeIsRemoved || null,
    disposeWhen: options.disposeWhen,
    domNodeDisposalCallback: null,
    dependencyTracking: {},
    dependenciesCount: 0,
    evaluationTimeoutInstance: null
  }
}

type ComputedState<T> = Omit<ReturnType<typeof initialState>, 'latestValue'> & { latestValue?: T }

export function computed<T> (
  evaluatorFunctionOrOptions: (() => T) | ComputedDefine<T>,
  evaluatorFunctionTarget?: any,
  options?: ComputedOptions<T>,
) {
  const opts = ((): ComputedDefine<T> => {
    if ('read' in evaluatorFunctionOrOptions) {
      // Single-parameter syntax - everything is on this "options" param
      return evaluatorFunctionOrOptions
    }
    // Multi-parameter syntax - construct the options according to the params passed
    return {
      ...options,
      read: evaluatorFunctionOrOptions,
      owner: evaluatorFunctionTarget,
    }
  })()

  if (typeof opts.read !== 'function') {
    throw Error('Pass a function that returns the value of the computed')
  }

  const writeFunction = 'write' in opts ? opts.write : null
  const state = initialState(opts)

  function computedObservable () {
    if (arguments.length > 0) {
      if (typeof writeFunction === 'function') {
                // Writing a value
        writeFunction.apply(state.evaluatorFunctionTarget, arguments as any)
      } else {
        throw new Error("Cannot write a value to a computed unless you specify a 'write' option. If you wish to read the current value, don't pass any parameters.")
      }
      return this // Permits chained assignments
    } else {
      // Reading the value
      if (!state.isDisposed) {
        dependencyDetection.registerDependency(computedObservable)
      }
      if (state.isDirty || (state.isSleeping && computedObservable.haveDependenciesChanged())) {
        computedObservable.evaluateImmediate()
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
    state.isSleeping = true     // Starts off sleeping; will awake on the first subscription
    extend(computedObservable, pureComputedOverrides)
  } else if (options.deferEvaluation) {
    extend(computedObservable, deferEvaluationOverrides)
  }

  if (koOptions.deferUpdates) {
    extenders.deferred(computedObservable, true)
  }

  if (koOptions.debug) {
    // #1731 - Aid debugging by exposing the computed's options
    computedObservable._options = opts
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
    computedObservable.evaluateImmediate()
  }

    // Attach a DOM node disposal callback so that the computed will be proactively disposed as soon as the node is
    // removed using ko.removeNode. But skip if isActive is false (there will never be any dependencies to dispose).
  if (state.disposeWhenNodeIsRemoved && computedObservable.isActive()) {
    addDisposeCallback(state.disposeWhenNodeIsRemoved, state.domNodeDisposalCallback = function () {
      computedObservable.dispose()
    })
  }

  return computedObservable
}

// Utility function that disposes a given dependencyTracking entry
function computedDisposeDependencyCallback<T> (this: KnockoutComputed<T>, id, entryToDispose) {
  if (entryToDispose !== null && entryToDispose.dispose) {
    entryToDispose.dispose()
  }
}

// This function gets called each time a dependency is detected while evaluating a computed.
// It's factored out as a shared function to avoid creating unnecessary function instances during evaluation.
function computedBeginDependencyDetectionCallback<T> (this: KnockoutComputed<T>, subscribable, id) {
  var computedObservable = this.computedObservable,
    state = computedObservable[computedState]
  if (!state.isDisposed) {
    if (this.disposalCount && this.disposalCandidates[id]) {
      // Don't want to dispose this subscription, as it's still being used
      computedObservable.addDependencyTracking(id, subscribable, this.disposalCandidates[id])
      this.disposalCandidates[id] = null // No need to actually delete the property - disposalCandidates is a transient object anyway
      --this.disposalCount
    } else if (!state.dependencyTracking[id]) {
      // Brand new subscription - add it
      computedObservable.addDependencyTracking(id, subscribable, state.isSleeping ? { _target: subscribable } : computedObservable.subscribeToDependency(subscribable))
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
  getDependenciesCount<T> (this: KnockoutComputed<T>) {
    return this[computedState].dependenciesCount
  },

  getDependencies<T> (this: KnockoutComputed<T>) {
    const dependencyTracking = this[computedState].dependencyTracking
    const dependentObservables = []

    objectForEach(dependencyTracking, function (id, dependency) {
      dependentObservables[dependency._order] = dependency._target
    })

    return dependentObservables
  },

  addDependencyTracking<T> (
    this: KnockoutComputed<T>,
    id: string,
    target: any,
    trackingObj,
  ) {
    if (this[computedState].pure && target === this) {
      throw Error("A 'pure' computed must not be called recursively")
    }

    this[computedState].dependencyTracking[id] = trackingObj
    trackingObj._order = this[computedState].dependenciesCount++
    trackingObj._version = target.getVersion()
  },

  haveDependenciesChanged<T> (this: KnockoutComputed<T>) {
    let dependency
    const {dependencyTracking} = this[computedState]

    for (const id in dependencyTracking) {
      if (hasOwnProperty(dependencyTracking, id)) {
        dependency = dependencyTracking[id]
        if ((this._evalDelayed && dependency._target._notificationIsPending) || dependency._target.hasChanged(dependency._version)) {
          return true
        }
      }
    }
  },
  markDirty<T> (this: KnockoutComputed<T>) {
        // Process "dirty" events if we can handle delayed notifications
    if (this._evalDelayed && !this[computedState].isBeingEvaluated) {
      this._evalDelayed(false)
    }
  },
  isActive<T> (this: KnockoutComputed<T>) {
    const state = this[computedState]
    return state.isDirty || state.dependenciesCount > 0
  },
  respondToChange<T> (this: KnockoutComputed<T>) {
        // Ignore "change" events if we've already scheduled a delayed notification
    if (!this._notificationIsPending) {
      this.evaluatePossiblyAsync()
    } else if (this[computedState].isDirty) {
      this[computedState].isStale = true
    }
  },
  subscribeToDependency<T> (this: KnockoutComputed<T>, target) {
    if (target._deferUpdates) {
      var dirtySub = target.subscribe(this.markDirty, this, 'dirty'),
        changeSub = target.subscribe(this.respondToChange, this)
      return {
        _target: target,
        dispose () {
          dirtySub.dispose()
          changeSub.dispose()
        }
      }
    } else {
      return target.subscribe(this.evaluatePossiblyAsync, this)
    }
  },
  evaluatePossiblyAsync<T> (this: KnockoutComputed<T>) {
    var computedObservable = this,
      throttleEvaluationTimeout = computedObservable.throttleEvaluation
    if (throttleEvaluationTimeout && throttleEvaluationTimeout >= 0) {
      clearTimeout(this[computedState].evaluationTimeoutInstance)
      this[computedState].evaluationTimeoutInstance = safeSetTimeout(function () {
        computedObservable.evaluateImmediate(true /* notifyChange */)
      }, throttleEvaluationTimeout)
    } else if (computedObservable._evalDelayed) {
      computedObservable._evalDelayed(true)
    } else {
      computedObservable.evaluateImmediate(true)
    }
  },
  evaluateImmediate<T> (this: KnockoutComputed<T>, notifyChange?: boolean) {
    var computedObservable = this,
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

    if (state.disposeWhenNodeIsRemoved && !domNodeIsAttachedToDocument(state.disposeWhenNodeIsRemoved) || disposeWhen && disposeWhen()) {
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
  evaluateImmediate_CallReadWithDependencyDetection<T> (this: KnockoutComputed<T>, notifyChange?: boolean) {
    // This function is really just part of the evaluateImmediate logic. You would never call it from anywhere else.
    // Factoring it out into a separate function means it can be independent of the try/catch block in evaluateImmediate,
    // which contributes to saving about 40% off the CPU overhead of computed evaluation (on V8 at least).

    var computedObservable = this,
      state = computedObservable[computedState],
      changed = false

        // Initially, we assume that none of the subscriptions are still being used (i.e., all are candidates for disposal).
        // Then, during evaluation, we cross off any that are in fact still being used.
    var isInitial = state.pure ? undefined : !state.dependenciesCount,   // If we're evaluating when there are no previous dependencies, it must be the first time
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

    var newValue = this.evaluateImmediate_CallReadThenEndDependencyDetection(state, dependencyDetectionContext)

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
      if (options.debug) { computedObservable._latestValue = newValue }

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
  evaluateImmediate_CallReadThenEndDependencyDetection<T> (
    this: KnockoutComputed<T>,
    state: ComputedState<T>,
    dependencyDetectionContext,
  ) {
    // This function is really part of the evaluateImmediate_CallReadWithDependencyDetection logic.
    // You'd never call it from anywhere else. Factoring it out means that evaluateImmediate_CallReadWithDependencyDetection
    // can be independent of try/finally blocks, which contributes to saving about 40% off the CPU
    // overhead of computed evaluation (on V8 at least).

    try {
      const readFunction = state.readFunction
      return state.evaluatorFunctionTarget
        ? readFunction.call(state.evaluatorFunctionTarget)
        : readFunction()
    } finally {
      dependencyDetection.end()

      // For each subscription no longer being used, remove it from the active subscriptions list and dispose it
      if (dependencyDetectionContext.disposalCount && !state.isSleeping) {
        objectForEach(dependencyDetectionContext.disposalCandidates, computedDisposeDependencyCallback)
      }

      state.isStale = state.isDirty = false
    }
  },
  peek<T> (
    this: KnockoutComputed<T>,
    forceEvaluate?: boolean,
  ) {
    // Peek won't ordinarily re-evaluate, except while the computed is sleeping
    //  or to get the initial value when "deferEvaluation" is set.
    const state = this[computedState]
    if ((state.isDirty && (forceEvaluate || !state.dependenciesCount)) || (state.isSleeping && this.haveDependenciesChanged())) {
      this.evaluateImmediate()
    }
    return state.latestValue
  },

  get [LATEST_VALUE] (this: KnockoutComputed<T>) {
    return this.peek()
  },

  limit<T> (
    this: KnockoutComputed<T>,
    limitFunction: RateLimitFunction,
  ) {
    const state = this[computedState]
    // Override the limit function with one that delays evaluation as well
    subscribable.fn.limit.call(this, limitFunction)
    Object.assign(this, {
      _evalIfChanged<T> (this: KnockoutComputed<T>) {
        if (!this[computedState].isSleeping) {
          if (this[computedState].isStale) {
            this.evaluateImmediate()
          } else {
            this[computedState].isDirty = false
          }
        }
        return state.latestValue
      },
      _evalDelayed<T> (this: KnockoutComputed<T>, isChange: boolean) {
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
  dispose<T> (this: KnockoutComputed<T>) {
    var state = this[computedState]
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
  beforeSubscriptionAdd<T> (this: KnockoutComputed<T>, event: KnockoutEventType) {
        // If asleep, wake up the computed by subscribing to any dependencies.
    var computedObservable = this,
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
        var dependenciesOrder = []
        objectForEach(state.dependencyTracking, function (id, dependency) {
          dependenciesOrder[dependency._order] = id
        })
                // Next, subscribe to each one
        arrayForEach(dependenciesOrder, function (id, order) {
          var dependency = state.dependencyTracking[id],
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

      if (!state.isDisposed) {     // test since evaluating could trigger disposal
        computedObservable.notifySubscribers(state.latestValue, 'awake')
      }
    }
  },

  afterSubscriptionRemove<T> (
    this: KnockoutComputed<T>,
    event: KnockoutEventType,
  ) {
    var state = this[computedState]
    if (!state.isDisposed && event === 'change' && !this.hasSubscriptionsForEvent('change')) {
      objectForEach(state.dependencyTracking, (id: number, dependency: KnockoutComputed<T>) => {
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

  getVersion<T> (this: KnockoutComputed<T>) {
    // Because a pure computed is not automatically updated while it is sleeping, we can't
    // simply return the version number. Instead, we check if any of the dependencies have
    // changed and conditionally re-evaluate the computed observable.
    var state = this[computedState]
    if (state.isSleeping && (state.isStale || this.haveDependenciesChanged())) {
      this.evaluateImmediate()
    }
    return subscribable.fn.getVersion.call(this)
  }
} as const

const deferEvaluationOverrides = {
  beforeSubscriptionAdd<T> (
    this: KnockoutComputed<T>,
    event: KnockoutEventType,
  ) {
    // This will force a computed with deferEvaluation to evaluate when the first subscription is registered.
    if (event === 'change' || event === 'beforeChange') {
      this.peek()
    }
  }
}

Object.setPrototypeOf(computed.fn, subscribable.fn)

// Set the proto values for ko.computed
const protoProp = observable.protoProperty as ProtoProperty
computed.fn[protoProp] = computed

/* This is used by ko.isObservable */
observable.observablePrototypes.add(computed)

export function isComputed<T> (
  instance: KnockoutComputed<T> | T,
): instance is KnockoutComputed<T> {
  return (typeof instance === 'function' &&
    (instance as any)[protoProp] === computed)
}

export function isPureComputed<T> (
  instance: KnockoutComputed<T> | T,
): instance is KnockoutPureComputed<T> {
  return isComputed(instance) &&
    (instance as any)[computedState] &&
    (instance as any)[computedState].pure
}

export function pureComputed<T> (
  evaluatorFunctionOrOptions: (() => T) | Omit<ReadonlyComputedDefine<T>,
  'pure'>, evaluatorFunctionTarget: any,
) {
  if (typeof evaluatorFunctionOrOptions === 'function') {
    return computed(evaluatorFunctionOrOptions, evaluatorFunctionTarget, {'pure': true})
  } else {
    const optionsClone = {
      ...evaluatorFunctionOrOptions, pure: true }
    return computed(optionsClone, evaluatorFunctionTarget)
  }
}



interface ReadonlyComputedOptions<T> {
  /**
   * Disposal of the computed observable will be triggered when the specified DOM node is removed by KO.
   * This feature is used to dispose computed observables used in bindings when nodes are removed by the template and control-flow bindings.
   */
  disposeWhenNodeIsRemoved?: Node;
  /**
   * This function is executed before each re-evaluation to determine if the computed observable should be disposed.
   * A true-ish result will trigger disposal of the computed observable.
   */
  disposeWhen?(): boolean;
  /**
   * Defines the value of 'this' whenever KO invokes your 'read' or 'write' callbacks.
   */
  owner?: any;
  /**
   * If true, then the value of the computed observable will not be evaluated until something actually attempts to access its value or manually subscribes to it.
   * By default, a computed observable has its value determined immediately during creation.
   */
  deferEvaluation?: boolean;
  /**
   * If true, the computed observable will be set up as a purecomputed observable. This option is an alternative to the ko.pureComputed constructor.
   */
  pure?: boolean;
}

interface WriteableComputedOptions<T, U = T> extends ReadonlyComputedOptions<T> {
  /**
   * Makes the computed observable writable. This is a function that receives values that other code is trying to write to your computed observable.
   * It’s up to you to supply custom logic to handle the incoming values, typically by writing the values to some underlying observable(s).
   * @param value Value being written to the computer observable.
   */
  write (value: U): void
}


interface ReadonlyComputedDefine<T> extends ReadonlyComputedOptions<T> {
  /**
   * A function that is used to evaluate the computed observable’s current value.
   */
  read(): T;
}

interface WriteableComputedDefine<T, U> extends ReadonlyComputedDefine<T>, WriteableComputedOptions<T, U> {}

type ComputedOptions<T, U = T> = ReadonlyComputedOptions<T> | WriteableComputedOptions<T, U>
type ComputedDefine<T, U = T> = ReadonlyComputedDefine<T> | WriteableComputedDefine<T, U>

type KnockoutComputedFunctions = typeof computed.fn


declare global {
  interface KnockoutComputed<T> extends Omit<KnockoutObservable<T>, keyof KnockoutComputed<T> | keyof KnockoutComputedFunctions>, KnockoutComputedFunctions {
    [computedState]: ComputedState<T>
    fn: KnockoutComputedFunctions
    [LATEST_VALUE]: T

    _evalDelayed?: (this: KnockoutComputed<T>, isChange: boolean) => void

    /**
     * Manually disposes the computed observable, clearing all subscriptions to dependencies.
     * This function is useful if you want to stop a computed observable from being updated or want to clean up memory for a
     * computed observable that has dependencies on observables that won’t be cleaned.
     */
    dispose(): void;
    /**
     * Customizes observables basic functionality.
     * @param requestedExtenders Name of the extender feature and it's value, e.g. { notify: 'always' }, { rateLimit: 50 }
     */
    extend(requestedExtenders: { [key: string]: any; }): KnockoutComputed<T>;
  }

  interface KnockoutWriteableComputed<T, U> extends KnockoutComputed<T> {
    /**
     * Pass the value to the `write` function given to the computed.
     */
    (value: U): void
  }

  interface KnockoutComputedArray<T> extends KnockoutComputed<T[]>, KnockoutArrayProperties<T> {
  }

  interface KnockoutPureComputed<T> extends KnockoutComputed<T> {

  }

  /**
   * This is the `(t)ko.computed` function that creates a computed
   * observable.
   */
  interface KnockoutComputedStatic {
    fn: KnockoutComputedFunctions

    /**
     * Creates computed observable.
     * @param evaluatorFunction Function that computes the observable value.
     * @param context Defines the value of 'this' when evaluating the computed observable.
     * @param options An object with further properties for the computed observable.
     */
    <T>(evaluatorFunction: () => T, context?: any, options?: ReadonlyComputedOptions<T>): KnockoutComputed<T>

    /**
     * Creates computed observable.
     * @param options An object that defines the computed observable options and behavior.
     * @param context Defines the value of 'this' when evaluating the computed observable.
     */
    <T>(options: ReadonlyComputedDefine<T>, context?: any): KnockoutComputed<T>

    /**
     * Creates writeable computed observable.
     * @param evaluatorFunction Function that computes the observable value.
     * @param context Defines the value of 'this' when evaluating the computed observable.
     * @param options An object with further properties for the computed observable.
     */
    <T, U>(evaluatorFunction: () => T, context?: any, options?: WriteableComputedOptions<T, U>): KnockoutWriteableComputed<T, U>
    /**
     * Creates writeable computed observable.
     * @param options An object that defines the computed observable options and behavior.
     * @param context Defines the value of 'this' when evaluating the computed observable.
     */
    <T, U>(options: WriteableComputedDefine<T, U>, context?: any): KnockoutWriteableComputed<T, U>
  }

  interface KnockoutEventTypeInterface {
    asleep: true
    awake: true
  }
}
