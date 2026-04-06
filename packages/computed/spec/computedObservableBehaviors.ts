import { expect } from 'chai'
import sinon from 'sinon'

import { arrayForEach } from '@tko/utils'

import {
  isSubscribable,
  isObservable,
  observable,
  unwrap,
  dependencyDetection,
  isWritableObservable,
  isWriteableObservable,
  observableArray,
  subscribable
} from '@tko/observable'

import type { ObservableArray } from '@tko/observable'

import { computed, isPureComputed, isComputed } from '../dist'

const browserSupportsProtoAssignment = typeof Object.setPrototypeOf === 'function'

describe('Dependent Observable', function () {
  let cleanups: Array<() => void>

  beforeEach(function () {
    cleanups = []
  })

  afterEach(function () {
    while (cleanups.length) {
      cleanups.pop()?.()
    }
  })

  it('Should be subscribable', function () {
    const instance = computed(function () {})
    expect(isSubscribable(instance)).to.equal(true)
  })

  it('Should not advertise that ko.computed is observable', function () {
    expect(isObservable(computed)).to.equal(false)
  })

  it('Should advertise that instances are observable', function () {
    const instance = computed(function () {})
    expect(isObservable(instance)).to.equal(true)
  })

  it('Should unwrap the underlying value of observables', function () {
    const someObject = { abc: 123 },
      observablePrimitiveValue = observable(123),
      observableObjectValue = observable(someObject),
      observableNullValue = observable(null),
      observableUndefinedValue = observable(undefined),
      computedValue = computed(function () {
        return observablePrimitiveValue() + 1
      })

    expect(unwrap(observablePrimitiveValue)).to.equal(123)
    expect(unwrap(observableObjectValue)).to.equal(someObject)
    expect(unwrap(observableNullValue)).to.equal(null)
    expect(unwrap(observableUndefinedValue)).to.equal(undefined)
    expect(unwrap(computedValue)).to.equal(124)
  })

  it('Should advertise that instances are computed', function () {
    const instance = computed(function () {})
    expect(isComputed(instance)).to.equal(true)
  })

  it('Should advertise that instances are not pure computed', function () {
    const instance = computed(function () {})
    expect(isPureComputed(instance)).to.equal(false)
  })

  it('Should advertise that instances cannot have values written to them', function () {
    const instance = computed(function () {})
    expect(isWriteableObservable(instance)).to.equal(false)
    expect(isWritableObservable(instance)).to.equal(false)
  })

  it('ko.isComputed should return false for non-computed values', function () {
    arrayForEach(
      [
        undefined,
        null,
        'x',
        {},
        function () {},
        observable(),
        (function () {
          const x = computed(function () {})
          x.__ko_proto__ = {}
          return x
        })()
      ],
      value => expect(isComputed(value)).to.equal(false)
    )
  })

  it('Should require an evaluator function as constructor param', function () {
    expect(function () {
      computed()
    }).to.throw()
  })

  it('Should be able to read the current value of the evaluator function', function () {
    const instance = computed(function () {
      return 123
    })
    expect(instance()).to.equal(123)
  })

  it('Should not be able to write a value to it if there is no "write" callback', function () {
    const instance = computed(function () {
      return 123
    })

    expect(function () {
      instance(456)
    }).to.throw()
    expect(instance()).to.equal(123)
  })

  it('Should invoke the "write" callback, where present, if you attempt to write a value to it', function () {
    let invokedWriteWithValue, invokedWriteWithThis
    const instance = computed({
      read: function () {},
      write: function (value) {
        invokedWriteWithValue = value
        invokedWriteWithThis = this
      }
    })

    const someContainer = { depObs: instance }
    someContainer.depObs('some value')
    expect(invokedWriteWithValue).to.equal('some value')
    expect(invokedWriteWithThis).to.equal(
      function () {
        return this
      }.call(null)
    ) // Since no owner was specified
  })

  it('Should be able to write to multiple computed properties on a model object using chaining syntax', function () {
    const model = {
      prop1: computed({
        read: function () {},
        write: function (value) {
          expect(value).to.equal('prop1')
        }
      }),
      prop2: computed({
        read: function () {},
        write: function (value) {
          expect(value).to.equal('prop2')
        }
      })
    }
    model.prop1('prop1').prop2('prop2')
  })

  it('Should be able to use Function.prototype methods to access/update', function () {
    const instance = computed({
      read: function () {
        return 'A'
      },
      write: function (/* value */) {}
    })
    const obj = {}

    expect(instance.call(null)).to.equal('A')
    expect(instance.apply(null, [])).to.equal('A')
    expect(instance.call(obj, 'B')).to.equal(obj)
  })

  it('Should use options.owner as "this" when invoking the "write" callback, and can pass multiple parameters', function () {
    let invokedWriteWithArgs, invokedWriteWithThis
    const someOwner = {}
    const obs = observable()
    const instance = computed({
      read: function () {
        return obs()
      },
      write: function () {
        obs(null)
        invokedWriteWithArgs = Array.prototype.slice.call(arguments, 0)
        invokedWriteWithThis = this
      },
      owner: someOwner
    })

    instance('first', 2, ['third1', 'third2'])
    expect(invokedWriteWithArgs.length).to.equal(3)
    expect(invokedWriteWithArgs[0]).to.equal('first')
    expect(invokedWriteWithArgs[1]).to.equal(2)
    expect(invokedWriteWithArgs[2]).to.deep.equal(['third1', 'third2'])
    expect(invokedWriteWithThis).to.equal(someOwner)
  })

  it('Should use the second arg (evaluatorFunctionTarget) for "this" when calling read/write if no options.owner was given', function () {
    let expectedThis = {},
      actualReadThis,
      actualWriteThis
    const obs = observable()
    const instance = computed(
      {
        read: function () {
          actualReadThis = this
          return obs()
        },
        write: function () {
          actualWriteThis = this
          obs(null)
        }
      },
      expectedThis
    )

    instance('force invocation of write')

    expect(actualReadThis).to.equal(expectedThis)
    expect(actualWriteThis).to.equal(expectedThis)
  })

  it('Should be able to pass evaluator function using "options" parameter called "read"', function () {
    const instance = computed({
      read: function () {
        return 123
      }
    })
    expect(instance()).to.equal(123)
  })

  it('Should cache result of evaluator function and not call it again until dependencies change', function () {
    let timesEvaluated = 0
    const instance = computed(function () {
      timesEvaluated++
      return 123
    })
    expect(instance()).to.equal(123)
    expect(instance()).to.equal(123)
    expect(timesEvaluated).to.equal(1)
  })

  it('Should automatically update value when a dependency changes', function () {
    const observableInstance = observable(1)
    const dependantObservable = computed(function () {
      return observableInstance() + 1
    })
    expect(dependantObservable()).to.equal(2)

    observableInstance(50)
    expect(dependantObservable()).to.equal(51)
  })

  it("Should be able to use 'peek' on an observable to avoid a dependency", function () {
    const observableInstance = observable(1),
      computedInstance = computed(function () {
        return observableInstance.peek() + 1
      })
    expect(computedInstance()).to.equal(2)

    observableInstance(50)
    expect(computedInstance()).to.equal(2) // value wasn't changed
  })

  it("Should be able to use 'ko.ignoreDependencies' within a computed to avoid dependencies", function () {
    const observableInstance = observable(1),
      computedInstance = computed(function () {
        return dependencyDetection.ignoreDependencies(function () {
          return observableInstance() + 1
        })
      })
    expect(computedInstance()).to.equal(2)

    observableInstance(50)
    expect(computedInstance()).to.equal(2) // value wasn't changed
  })

  it('Should unsubscribe from previous dependencies each time a dependency changes', function () {
    const observableA = observable('A')
    const observableB = observable('B')
    let observableToUse = 'A'
    let timesEvaluated = 0
    const dependantObservable = computed(function () {
      timesEvaluated++
      return observableToUse == 'A' ? observableA() : observableB()
    })

    expect(dependantObservable()).to.equal('A')
    expect(timesEvaluated).to.equal(1)

    // Changing an unrelated observable doesn't trigger evaluation
    observableB('B2')
    expect(timesEvaluated).to.equal(1)

    // Switch to other observable
    observableToUse = 'B'
    observableA('A2')
    expect(dependantObservable()).to.equal('B2')
    expect(timesEvaluated).to.equal(2)

    // Now changing the first observable doesn't trigger evaluation
    observableA('A3')
    expect(timesEvaluated).to.equal(2)
  })

  it('Should notify subscribers of changes', function () {
    let notifiedValue
    const observableInstance = observable(1)
    const dependantObservable = computed(function () {
      return observableInstance() + 1
    })
    dependantObservable.subscribe(function (value) {
      notifiedValue = value
    })

    expect(notifiedValue).to.equal(undefined)
    observableInstance(2)
    expect(notifiedValue).to.equal(3)
  })

  it('Should notify "spectator" subscribers about changes', function () {
    const obs = observable()
    const comp = computed(() => obs())
    const notifiedValues = new Array()
    comp.subscribe(
      function (value) {
        notifiedValues.push(value)
      },
      null,
      'spectate'
    )

    obs('A')
    obs('B')
    expect(notifiedValues).to.deep.equal(['A', 'B'])
  })

  it('Should notify "beforeChange" subscribers before changes', function () {
    let notifiedValue
    const observableInstance = observable(1)
    const dependantObservable = computed(function () {
      return observableInstance() + 1
    })
    dependantObservable.subscribe(
      function (value) {
        notifiedValue = value
      },
      null,
      'beforeChange'
    )

    expect(notifiedValue).to.equal(undefined)
    observableInstance(2)
    expect(notifiedValue).to.equal(2)
    expect(dependantObservable()).to.equal(3)
  })

  it('Should only update once when each dependency changes, even if evaluation calls the dependency multiple times', function () {
    const notifiedValues = new Array()
    const observableInstance = observable()
    const dependantObservable = computed(function () {
      return observableInstance() * observableInstance()
    })
    dependantObservable.subscribe(function (value) {
      notifiedValues.push(value)
    })
    observableInstance(2)
    expect(notifiedValues.length).to.equal(1)
    expect(notifiedValues[0]).to.equal(4)
  })

  it('Should be able to chain computed observables', function () {
    const underlyingObservable = observable(1)
    const computed1 = computed(function () {
      return underlyingObservable() + 1
    })
    const computed2 = computed(function () {
      return computed1() + 1
    })
    expect(computed2()).to.equal(3)

    underlyingObservable(11)
    expect(computed2()).to.equal(13)
  })

  it("Should be able to use 'peek' on a computed observable to avoid a dependency", function () {
    const underlyingObservable = observable(1)
    const computed1 = computed(function () {
      return underlyingObservable() + 1
    })
    const computed2 = computed(function () {
      return computed1.peek() + 1
    })
    expect(computed2()).to.equal(3)
    expect(computed2.isActive()).to.equal(false)

    underlyingObservable(11)
    expect(computed2()).to.equal(3) // value wasn't changed
  })

  it('Should accept "owner" parameter to define the object on which the evaluator function should be called', function () {
    const model = new (function () {
      this.greeting = 'hello'
      this.fullMessageWithoutOwner = computed(function () {
        return (this || {}).greeting + ' world'
      })
      this.fullMessageWithOwner = computed(function () {
        return this.greeting + ' world'
      }, this)
    })()
    expect(model.fullMessageWithoutOwner()).to.equal('undefined world')
    expect(model.fullMessageWithOwner()).to.equal('hello world')
  })

  it('Should dispose and not call its evaluator function when the disposeWhen function returns true', function () {
    const underlyingObservable = observable(100)
    let timeToDispose = false
    let timesEvaluated = 0
    const computedInstance = computed(
      function () {
        timesEvaluated++
        return underlyingObservable() + 1
      },
      null,
      {
        disposeWhen: function () {
          return timeToDispose
        }
      }
    )
    expect(timesEvaluated).to.equal(1)
    expect(computedInstance.getDependenciesCount()).to.equal(1)
    expect(computedInstance.getDependencies()).to.deep.equal([underlyingObservable])
    expect(computedInstance.isActive()).to.equal(true)

    timeToDispose = true
    underlyingObservable(101)
    expect(timesEvaluated).to.equal(1)
    expect(computedInstance.getDependenciesCount()).to.equal(0)
    expect(computedInstance.getDependencies()).to.deep.equal([])
    expect(computedInstance.isActive()).to.equal(false)
  })

  it("Should dispose itself as soon as disposeWhen returns true, as long as it isn't waiting for a DOM node to be removed", function () {
    const underlyingObservable = observable(100),
      computedInstance = computed(underlyingObservable, null, {
        disposeWhen: function () {
          return true
        }
      })

    expect(underlyingObservable.getSubscriptionsCount()).to.equal(0)
    expect(computedInstance.isActive()).to.equal(false)
  })

  it('Should delay disposal until after disposeWhen returns false if it is waiting for a DOM node to be removed', function () {
    let underlyingObservable = observable(100),
      shouldDispose = true,
      computedInstance = computed(underlyingObservable, null, {
        disposeWhen: function () {
          return shouldDispose
        },
        disposeWhenNodeIsRemoved: true
      })

    // Even though disposeWhen returns true, it doesn't dispose yet, because it's
    // expecting an initial 'false' result to indicate the DOM node is still in the document
    expect(underlyingObservable.getSubscriptionsCount()).to.equal(1)
    expect(computedInstance.isActive()).to.equal(true)

    // Trigger the false result. Of course it still doesn't dispose yet, because
    // disposeWhen says false.
    shouldDispose = false
    underlyingObservable(101)
    expect(underlyingObservable.getSubscriptionsCount()).to.equal(1)
    expect(computedInstance.isActive()).to.equal(true)

    // Now trigger a true result. This time it will dispose.
    shouldDispose = true
    underlyingObservable(102)
    expect(underlyingObservable.getSubscriptionsCount()).to.equal(0)
    expect(computedInstance.isActive()).to.equal(false)
  })

  it('Should describe itself as active if the evaluator has dependencies on its first run', function () {
    const someObservable = observable('initial'),
      computedInstance = computed(function () {
        return someObservable()
      })
    expect(computedInstance.isActive()).to.equal(true)
  })

  it('Should describe itself as inactive if the evaluator has no dependencies on its first run', function () {
    const computedInstance = computed(function () {
      return 123
    })
    expect(computedInstance.isActive()).to.equal(false)
  })

  it('Should describe itself as inactive if subsequent runs of the evaluator result in there being no dependencies', function () {
    const someObservable = observable('initial')
    let shouldHaveDependency = true
    const computedInstance = computed(function () {
      if (shouldHaveDependency) someObservable()
    })
    expect(computedInstance.isActive()).to.equal(true)

    // Trigger a refresh
    shouldHaveDependency = false
    someObservable('modified')
    expect(computedInstance.isActive()).to.equal(false)
  })

  it('Should be inactive if it depends on an inactive computed', function () {
    const someObservable = observable('initial')
    let shouldHaveDependency = true
    const computed1 = computed(function () {
      if (shouldHaveDependency) someObservable()
    })
    const computed2 = computed(computed1)
    expect(computed2.isActive()).to.equal(true)

    // Trigger a refresh
    shouldHaveDependency = false
    someObservable('modified')
    expect(computed2.isActive()).to.equal(false)
  })

  it('Should advertise that instances *can* have values written to them if you supply a "write" callback', function () {
    const instance = computed({ read: function () {}, write: function () {} })
    expect(isWriteableObservable(instance)).to.equal(true)
    expect(isWritableObservable(instance)).to.equal(true)
  })

  it('Should allow deferring of evaluation (and hence dependency detection)', function () {
    let timesEvaluated = 0
    const instance = computed({
      read: function () {
        timesEvaluated++
        return 123
      },
      deferEvaluation: true
    })
    expect(timesEvaluated).to.equal(0)
    expect(instance()).to.equal(123)
    expect(timesEvaluated).to.equal(1)
  })

  it('Should perform dependency detection when subscribed to when constructed with "deferEvaluation"', function () {
    const data = observable(1),
      computedInstance = computed({ read: data, deferEvaluation: true }),
      result = observable()

    // initially computed has no dependencies since it has not been evaluated
    expect(computedInstance.getDependenciesCount()).to.equal(0)
    expect(computedInstance.getDependencies()).to.deep.equal([])

    // Now subscribe to computed
    computedInstance.subscribe(result)

    // The dependency should now be tracked
    expect(computedInstance.getDependenciesCount()).to.equal(1)
    expect(computedInstance.getDependencies()).to.deep.equal([data])

    // But the subscription should not have sent down the initial value
    expect(result()).to.equal(undefined)

    // Updating data should trigger the subscription
    data(42)
    expect(result()).to.equal(42)
  })

  it('Should fire "awake" event when deferred computed is first evaluated', function () {
    const data = observable('A'),
      computedInstance = computed({ read: data, deferEvaluation: true })

    const notifySpy = sinon.spy()
    computedInstance.subscribe(notifySpy, null, 'awake')

    sinon.assert.notCalled(notifySpy)

    expect(computedInstance()).to.equal('A')
    sinon.assert.calledWithExactly(notifySpy, 'A')
    sinon.assert.callCount(notifySpy, 1)

    // Subscribing or updating data shouldn't trigger any more notifications
    notifySpy.resetHistory()
    computedInstance.subscribe(function () {})
    data('B')
    computedInstance()
    sinon.assert.notCalled(notifySpy)
  })

  it('Should prevent recursive calling of read function', function () {
    const observableInstance = observable(0)
    computed(function () {
      // this both reads and writes to the observable
      // will result in errors like "Maximum call stack size exceeded" (chrome)
      // or "Out of stack space" (IE) or "too much recursion" (Firefox) if recursion
      // isn't prevented
      observableInstance(observableInstance() + 1)
    })
  })

  it('Should not subscribe to observables accessed through change notifications of a computed', function () {
    // See https://github.com/SteveSanderson/knockout/issues/341
    const observableDependent = observable(),
      observableIndependent = observable(),
      computedInstance = computed(function () {
        return observableDependent()
      })

    // initially there is only one dependency
    expect(computedInstance.getDependenciesCount()).to.equal(1)
    expect(computedInstance.getDependencies()).to.deep.equal([observableDependent])

    // create a change subscription that also accesses an observable
    computedInstance.subscribe(function () {
      observableIndependent()
    })
    // now trigger evaluation of the computed by updating its dependency
    observableDependent(1)
    // there should still only be one dependency
    expect(computedInstance.getDependenciesCount()).to.equal(1)
    expect(computedInstance.getDependencies()).to.deep.equal([observableDependent])

    // also test with a beforeChange subscription
    computedInstance.subscribe(
      function () {
        observableIndependent()
      },
      null,
      'beforeChange'
    )
    observableDependent(2)
    expect(computedInstance.getDependenciesCount()).to.equal(1)
    expect(computedInstance.getDependencies()).to.deep.equal([observableDependent])
  })

  it('Should not subscribe to observables accessed through change notifications of a modified observable', function () {
    // See https://github.com/SteveSanderson/knockout/issues/341
    const observableDependent = observable(),
      observableIndependent = observable(),
      observableModified = observable(),
      computedInstance = computed(function () {
        observableModified(observableDependent())
      })

    // initially there is only one dependency
    expect(computedInstance.getDependenciesCount()).to.equal(1)
    expect(computedInstance.getDependencies()).to.deep.equal([observableDependent])

    // create a change subscription that also accesses an observable
    observableModified.subscribe(function () {
      observableIndependent()
    })
    // now trigger evaluation of the computed by updating its dependency
    observableDependent(1)
    // there should still only be one dependency
    expect(computedInstance.getDependenciesCount()).to.equal(1)
    expect(computedInstance.getDependencies()).to.deep.equal([observableDependent])

    // also test with a beforeChange subscription
    observableModified.subscribe(
      function () {
        observableIndependent()
      },
      null,
      'beforeChange'
    )
    observableDependent(2)
    expect(computedInstance.getDependenciesCount()).to.equal(1)
    expect(computedInstance.getDependencies()).to.deep.equal([observableDependent])
  })

  it('Should be able to re-evaluate a computed that previously threw an exception', function () {
    const observableSwitch = observable(true),
      observableValue = observable(1),
      computedInstance = computed(function () {
        if (!observableSwitch()) {
          throw Error('Error during computed evaluation')
        } else {
          return observableValue()
        }
      })

    // Initially the computed evaluated successfully
    expect(computedInstance()).to.equal(1)

    expect(function () {
      // Update observable to cause computed to throw an exception
      observableSwitch(false)
    }).to.throw('Error during computed evaluation')

    // The value of the computed is now undefined, although currently it keeps the previous value
    expect(computedInstance()).to.equal(1)
    // The computed should not be dependent on the second observable
    expect(computedInstance.getDependenciesCount()).to.equal(1)
    expect(computedInstance.getDependencies()).to.deep.equal([observableSwitch])

    // Updating the second observable shouldn't re-evaluate computed
    observableValue(2)
    expect(computedInstance()).to.equal(1)

    // Update the first observable to cause computed to re-evaluate
    observableSwitch(1)
    expect(computedInstance()).to.equal(2)
  })

  it('Should expose a "notify" extender that can configure a computed to notify on all changes', function () {
    const notifiedValues = new Array()
    const observableInstance = observable(1)
    const computedInstance = computed(function () {
      return observableInstance()
    })
    computedInstance.subscribe(function (value) {
      notifiedValues.push(value)
    })

    expect(notifiedValues).to.deep.equal([])

    // Trigger update without changing value; the computed will not notify the change (default behavior)
    observableInstance.valueHasMutated()
    expect(notifiedValues).to.deep.equal([])

    // Set the computed to notify always
    computedInstance.extend({ notify: 'always' })
    observableInstance.valueHasMutated()
    expect(notifiedValues).to.deep.equal([1])
  })

  it('Should support array tracking using extender', function () {
    let myArray = observable(['Alpha', 'Beta', 'Gamma']),
      myComputed = computed(function () {
        return myArray().slice(-2)
      }).extend({ trackArrayChanges: true }),
      changelist

    expect(myComputed()).to.deep.equal(['Beta', 'Gamma'])

    const arrayChange = myComputed.subscribe(
      function (changes) {
        changelist = changes
      },
      null,
      'arrayChange'
    )

    myArray(['Alpha', 'Beta', 'Gamma', 'Delta'])
    expect(myComputed()).to.deep.equal(['Gamma', 'Delta'])
    expect(changelist).to.deep.equal([
      { status: 'deleted', value: 'Beta', index: 0 },
      { status: 'added', value: 'Delta', index: 1 }
    ])

    // Should clean up all subscriptions when arrayChange subscription is disposed
    arrayChange.dispose()
    expect(myComputed.getSubscriptionsCount()).to.equal(0)
  })

  // Borrowed from haberman/knockout (see knockout/knockout#359)
  it('Should allow long chains without overflowing the stack', function () {
    // maximum with previous code (when running this test only): Chrome 28: 1310, IE 10: 2200; FF 23: 103
    // maximum with changed code: Chrome 28: 2620, +100%, IE 10: 4900, +122%; FF 23: 267, +160%
    // (per #1622 and #1905, max depth reduced to pass tests in older FF)
    const depth = 100
    const first = observable(0)
    let last = first
    for (let i = 0; i < depth; i++) {
      ;(function () {
        const l = last
        last = computed(function () {
          return l() + 1
        })
      })()
    }
    const all = computed(function () {
      return last() + first()
    })
    first(1)
    expect(all()).to.equal(depth + 2)
  })

  it('Should inherit any properties defined on ko.subscribable.fn or computed.fn', function () {
    cleanups.push(function () {
      delete (subscribable.fn as any).customProp // Will be able to reach this
      delete (subscribable.fn as any).customFunc // Overridden on computed.fn
      delete computed.fn.customFunc // Will be able to reach this
    })
    ;(subscribable.fn as any).customProp = 'subscribable value'
    ;(subscribable.fn as any).customFunc = function () {
      throw new Error("Shouldn't be reachable")
    }
    computed.fn.customFunc = function () {
      return this()
    }

    const instance = computed(function () {
      return 123
    })
    expect(instance.customProp).to.equal('subscribable value')
    expect(instance.customFunc()).to.equal(123)
  })

  it('Should have access to functions added to "fn" on existing instances on supported browsers', function () {
    // On unsupported browsers, there's nothing to test
    if (!browserSupportsProtoAssignment) {
      return
    }

    cleanups.push(function () {
      delete (subscribable.fn as any).customFunction1
      delete computed.fn.customFunction2
    })

    const computedInstance = computed(function () {})

    const customFunction1 = function () {}
    const customFunction2 = function () {} // TODO ASI example

    ;(subscribable.fn as any).customFunction1 = customFunction1
    computed.fn.customFunction2 = customFunction2

    expect(computedInstance.customFunction1).to.equal(customFunction1)
    expect(computedInstance.customFunction2).to.equal(customFunction2)
  })

  it('Should not evaluate (or add dependencies) after it has been disposed', function () {
    let evaluateCount = 0,
      observableInstance = observable(0),
      computedInstance = computed(function () {
        return ++evaluateCount + observableInstance()
      })

    expect(evaluateCount).to.equal(1)
    computedInstance.dispose()

    // This should not cause a new evaluation
    observableInstance(1)
    expect(evaluateCount).to.equal(1)
    expect(computedInstance()).to.equal(1)
    expect(computedInstance.getDependenciesCount()).to.equal(0)
    expect(computedInstance.getDependencies()).to.deep.equal([])
  })

  it('Should not evaluate (or add dependencies) after it has been disposed if created with "deferEvaluation"', function () {
    let evaluateCount = 0,
      observableInstance = observable(0),
      computedInstance = computed({
        read: function () {
          return ++evaluateCount + observableInstance()
        },
        deferEvaluation: true
      })

    expect(evaluateCount).to.equal(0)
    computedInstance.dispose()

    // This should not cause a new evaluation
    observableInstance(1)
    expect(evaluateCount).to.equal(0)
    expect(computedInstance()).to.equal(undefined)
    expect(computedInstance.getDependenciesCount()).to.equal(0)
    expect(computedInstance.getDependencies()).to.deep.equal([])
  })

  it('Should not add dependencies if disposed during evaluation', function () {
    // This is a bit of a contrived example and likely won't occur in any actual applications.
    // A more likely scenario might involve a binding that removes a node connected to the binding,
    // causing the binding's computed observable to dispose.
    // See https://github.com/knockout/knockout/issues/1041
    let evaluateCount = 0,
      observableToTriggerDisposal = observable(false),
      observableGivingValue = observable(0)
    const computedInstance = computed(function () {
      if (observableToTriggerDisposal()) {
        computedInstance.dispose()
      }
      return ++evaluateCount + observableGivingValue()
    })

    // Check initial state
    expect(evaluateCount).to.equal(1)
    expect(computedInstance()).to.equal(1)
    expect(computedInstance.getDependenciesCount()).to.equal(2)
    expect(computedInstance.getDependencies()).to.deep.equal([observableToTriggerDisposal, observableGivingValue])
    expect(observableGivingValue.getSubscriptionsCount()).to.equal(1)

    // Now cause a disposal during evaluation
    observableToTriggerDisposal(true)
    expect(evaluateCount).to.equal(2)
    expect(computedInstance()).to.equal(2)
    expect(computedInstance.getDependenciesCount()).to.equal(0)
    expect(computedInstance.getDependencies()).to.deep.equal([])
    expect(observableGivingValue.getSubscriptionsCount()).to.equal(0)
  })

  describe('Context', function () {
    it('Should accurately report initial evaluation', function () {
      let observableInstance = observable(1),
        evaluationCount = 0,
        computedInstance = computed(function () {
          ++evaluationCount
          observableInstance() // for dependency
          return dependencyDetection.isInitial()
        })

      expect(evaluationCount).to.equal(1) // single evaluation
      expect(computedInstance()).to.equal(true) // value of isInitial was true

      observableInstance(2)
      expect(evaluationCount).to.equal(2) // second evaluation
      expect(computedInstance()).to.equal(false) // value of isInitial was false

      // value outside of computed is undefined
      expect(dependencyDetection.isInitial()).to.equal(undefined)
    })

    it('Should accurately report initial evaluation when deferEvaluation is true', function () {
      let observableInstance = observable(1),
        evaluationCount = 0,
        computedInstance = computed(
          function () {
            ++evaluationCount
            observableInstance() // for dependency
            return dependencyDetection.isInitial()
          },
          null,
          { deferEvaluation: true }
        )

      expect(evaluationCount).to.equal(0) // no evaluation yet
      expect(computedInstance()).to.equal(true) // first access causes evaluation; value of isInitial was true
      expect(evaluationCount).to.equal(1) // single evaluation

      observableInstance(2)
      expect(evaluationCount).to.equal(2) // second evaluation
      expect(computedInstance()).to.equal(false) // value of isInitial was false
    })

    it('Should accurately report the number of dependencies', function () {
      let observable1 = observable(1),
        observable2 = observable(1),
        evaluationCount = 0,
        computedInstance = computed(function () {
          ++evaluationCount
          // no dependencies at first
          expect(dependencyDetection.getDependenciesCount()).to.equal(0)
          expect(dependencyDetection.getDependencies()).to.deep.equal([])
          // add a single dependency
          observable1()
          expect(dependencyDetection.getDependenciesCount()).to.equal(1)
          expect(dependencyDetection.getDependencies()).to.deep.equal([observable1])
          // add a second one
          observable2()
          expect(dependencyDetection.getDependenciesCount()).to.equal(2)
          expect(dependencyDetection.getDependencies()).to.deep.equal([observable1, observable2])
          // accessing observable again doesn't affect count
          observable1()
          expect(dependencyDetection.getDependenciesCount()).to.equal(2)
          expect(dependencyDetection.getDependencies()).to.deep.equal([observable1, observable2])
        })

      expect(evaluationCount).to.equal(1) // single evaluation
      expect(computedInstance.getDependenciesCount()).to.equal(2) // matches value from context
      expect(computedInstance.getDependencies()).to.deep.equal([observable1, observable2])

      observable1(2)
      expect(evaluationCount).to.equal(2) // second evaluation
      expect(computedInstance.getDependenciesCount()).to.equal(2) // matches value from context
      expect(computedInstance.getDependencies()).to.deep.equal([observable1, observable2])

      // value outside of computed is undefined
      expect(dependencyDetection.getDependenciesCount()).to.equal(undefined)
      expect(dependencyDetection.getDependencies()).to.equal(undefined)
    })
  })

  describe('observableArray properties', function () {
    it('Should be able to call standard mutators without creating a subscription', function () {
      let timesEvaluated = 0,
        newArray: ObservableArray = observableArray(['Alpha', 'Beta', 'Gamma'])

      computed(function () {
        // Make a few standard mutations
        newArray.push('Delta')
        newArray.remove('Beta')
        newArray.splice(2, 1)

        // Peek to ensure we really had the intended effect
        expect(newArray.peek()).to.deep.equal(['Alpha', 'Gamma'])

        // Also make use of the KO delete/destroy functions to check they don't cause subscriptions
        newArray([{ someProp: 123 }])
        newArray.destroyAll()
        expect(newArray.peek()[0]._destroy).to.equal(true)
        newArray.removeAll()
        expect(newArray.peek()).to.deep.equal([])

        timesEvaluated++
      })

      // Verify that we haven't caused a subscription
      expect(timesEvaluated).to.equal(1)
      expect(newArray.getSubscriptionsCount()).to.equal(0)

      // Don't just trust getSubscriptionsCount - directly verify that mutating newArray doesn't cause a re-eval
      newArray.push('Another')
      expect(timesEvaluated).to.equal(1)
    })
  })
})
