import { expect } from 'chai'
import sinon from 'sinon'

import { isWriteableObservable, observable, dependencyDetection } from '@tko/observable'

import { isPureComputed, isComputed, computed, pureComputed } from '../dist'

describe('Pure Computed', function () {
  it('Observables should advertise that instances are not pure computed', function () {
    const instance = observable()
    expect(isPureComputed(instance)).to.eql(false)
  })

  it('Should advertise that instances are computed', function () {
    const computedInstance = pureComputed(function () {})
    expect(isComputed(computedInstance)).to.eql(true)
  })

  it('Should advertise that instances are pure computed', function () {
    const instance = pureComputed(function () {})
    expect(isPureComputed(instance)).to.eql(true)
  })

  it('Should advertise that instances are not computed', function () {
    const instance = observable()
    expect(isComputed(instance)).to.eql(false)
  })

  it('Should require an evaluator function as constructor param', function () {
    expect(function () {
      pureComputed()
    }).to.throw()
  })

  it('Should be able to pass evaluator function using "options" parameter called "read"', function () {
    const computedInstance = pureComputed({
      read: function () {
        return 123
      }
    })
    expect(computedInstance()).to.eql(123)
  })

  it('Should not be able to write a value to it if there is no "write" callback', function () {
    const computedInstance = pureComputed(function () {
      return 123
    })
    expect(isWriteableObservable(computedInstance)).to.eql(false)
    expect(function () {
      computedInstance(456)
    }).to.throw()
  })

  it('Should invoke the "write" callback, where present, if you attempt to write a value to it', function () {
    let invokedWriteWithValue
    const computedInstance = pureComputed({
      read: function () {},
      write: function (value) {
        invokedWriteWithValue = value
      }
    })
    expect(isWriteableObservable(computedInstance)).to.eql(true)
    computedInstance('some value')
    expect(invokedWriteWithValue).to.eql('some value')
  })

  it('Should describe itself as active initially', function () {
    const computedInstance = pureComputed(function () {})
    expect(computedInstance.isActive()).to.eql(true)
  })

  it('Should describe itself as inactive if the evaluator has no dependencies on its first run', function () {
    const computedInstance = pureComputed(function () {})
    computedInstance() // access the computed to evaluate it
    expect(computedInstance.isActive()).to.eql(false)
  })

  it('Should describe itself as active if the evaluator has dependencies on its first run', function () {
    const observableInstance = observable('initial'),
      computedInstance = computed(observableInstance)
    computedInstance() // access the computed to evaluate it
    expect(computedInstance.isActive()).to.eql(true)
  })

  it('Should evaluate on each access while sleeping when dependencies have changed', function () {
    let timesEvaluated = 0,
      data = observable('A'),
      computedInstance = pureComputed(function () {
        ++timesEvaluated
        return data()
      })

    expect(timesEvaluated).to.eql(0)

    expect(computedInstance()).to.eql('A')
    expect(timesEvaluated).to.eql(1)

    // Access after changing dependency causes re-evaluation
    data('B')
    expect(computedInstance()).to.eql('B')
    expect(timesEvaluated).to.eql(2)

    // Test a second time using peek
    data('C')
    expect(computedInstance.peek()).to.eql('C')
    expect(timesEvaluated).to.eql(3)

    // Access without changing dependency does not cause evaluation
    expect(computedInstance()).to.eql('C')
    expect(timesEvaluated).to.eql(3)
  })

  it('Should notify "spectator" subscribers whenever the value changes', function () {
    const obs = observable('A')
    const computed = pureComputed(obs)
    const computed2 = pureComputed(computed)
    const notifiedValues = new Array()

    computed.subscribe(
      function (value) {
        notifiedValues.push(value)
        expect(computed()).to.equal(value)
        expect(computed2()).to.equal(value)
      },
      null,
      'spectate'
    )

    expect(notifiedValues).to.eql([])

    // Reading the computed for the first time causes a notification
    expect(computed()).to.eql('A')
    expect(computed2()).to.eql('A')
    expect(notifiedValues).to.eql(['A'])

    // Reading it a second time doesn't
    expect(computed()).to.eql('A')
    expect(computed2()).to.eql('A')
    expect(notifiedValues).to.eql(['A'])

    // Changing the dependency doesn't, but reading the computed again does
    obs('B')
    expect(notifiedValues).to.eql(['A'])
    expect(computed()).to.eql('B')
    expect(notifiedValues).to.eql(['A', 'B'])
  })

  it('Should not subscribe to dependencies while sleeping', function () {
    const data = observable('A'),
      computedInstance = pureComputed(data)

    // Accessing the computed evaluates it
    expect(computedInstance()).to.eql('A')

    // No subscription is registered on the dependent observable
    expect(data.getSubscriptionsCount()).to.eql(0)

    // getDependenciesCount returns the correct number
    expect(computedInstance.getDependenciesCount()).to.eql(1)
    expect(computedInstance.getDependencies()).to.eql([data])
  })

  it('Should not evaluate after it has been disposed', function () {
    let timesEvaluated = 0,
      data = observable('A'),
      computedInstance = pureComputed(function () {
        ++timesEvaluated
        return data()
      })

    expect(computedInstance()).to.eql('A')
    expect(timesEvaluated).to.eql(1)

    computedInstance.dispose()
    expect(computedInstance.isActive()).to.eql(false)

    // These should not cause a new evaluation
    data('B')
    expect(computedInstance()).to.eql('A')
    expect(timesEvaluated).to.eql(1)
  })

  it('Should awaken and perform dependency detection when subscribed to', function () {
    const data = observable('A'),
      computedInstance = pureComputed(data),
      notifiedValues = new Array()

    // Subscribe to computed; the dependency should now be tracked
    computedInstance.subscribe(function (value) {
      notifiedValues.push(value)
    })
    expect(data.getSubscriptionsCount()).to.eql(1)
    expect(computedInstance.getDependenciesCount()).to.eql(1)
    expect(computedInstance.getDependencies()).to.eql([data])

    // The subscription should not have sent down the initial value
    expect(notifiedValues).to.eql([])

    // Updating data should trigger the subscription
    data('B')
    expect(notifiedValues).to.eql(['B'])
  })

  it('Should go back to sleep when all subscriptions are disposed', function () {
    const data = observable('A'),
      computedInstance = pureComputed(data),
      subscription = computedInstance.subscribe(function () {})

    expect(data.getSubscriptionsCount()).to.eql(1)
    expect(computedInstance.getDependenciesCount()).to.eql(1)
    expect(computedInstance.getDependencies()).to.eql([data])

    // Dispose the subscription to the computed
    subscription.dispose()
    // It goes to sleep, disposing its subscription to the observable
    expect(data.getSubscriptionsCount()).to.eql(0)
    expect(computedInstance.getDependenciesCount()).to.eql(1) // dependency count of computed doesn't change
    expect(computedInstance.getDependencies()).to.eql([data])
  })

  it('Should fire "awake" and "asleep" events when changing state', function () {
    const data = observable('A'),
      computedInstance = pureComputed(data)

    const notifySpy = sinon.spy()
    computedInstance.subscribe(notifySpy.bind(null, 'awake'), null, 'awake')
    computedInstance.subscribe(notifySpy.bind(null, 'asleep'), null, 'asleep')

    // Subscribing to non-change events doesn't awaken computed
    expect(data.getSubscriptionsCount()).to.eql(0)

    // Subscribe to computed; notifies with value
    const subscription = computedInstance.subscribe(function () {})
    expect(notifySpy.getCalls().map(call => call.args)).to.eql([['awake', 'A']])
    expect(data.getSubscriptionsCount()).to.eql(1)

    notifySpy.resetHistory()
    data('B')
    sinon.assert.notCalled(notifySpy)

    subscription.dispose()
    expect(notifySpy.getCalls().map(call => call.args)).to.eql([['asleep', undefined]])
    expect(data.getSubscriptionsCount()).to.eql(0)
  })

  it('Should subscribe to dependencies when awakened while minimizing evaluations', function () {
    let timesEvaluated = 0,
      data = observable('A'),
      computedInstance = pureComputed(function () {
        ++timesEvaluated
        return data()
      }),
      notifiedValues = new Array(),
      subscribeFunc = function (value) {
        notifiedValues.push(value)
      },
      subscription

    expect(timesEvaluated).to.eql(0)

    expect(computedInstance()).to.eql('A')
    expect(timesEvaluated).to.eql(1)
    expect(computedInstance.getDependenciesCount()).to.eql(1)
    expect(computedInstance.getDependencies()).to.eql([data])

    // Subscribing to the computed adds a subscription to the dependency without re-evaluating
    subscription = computedInstance.subscribe(subscribeFunc)
    expect(data.getSubscriptionsCount()).to.eql(1)
    expect(timesEvaluated).to.eql(1)

    // Dispose the subscription; reading the sleeping computed doesn't cause re-evaluation
    subscription.dispose()
    expect(computedInstance()).to.eql('A')
    expect(timesEvaluated).to.eql(1)

    // Updating data doesn't trigger re-evaluation (computed is sleeping)
    data('B')
    expect(timesEvaluated).to.eql(1)

    // Subscribing to the computed now does cause a re-evaluation because the dependency was changed
    subscription = computedInstance.subscribe(subscribeFunc)
    expect(timesEvaluated).to.eql(2)
    expect(notifiedValues).to.eql([]) // But nothing notified

    // Updating data should re-evaluate and trigger the subscription
    data('C')
    expect(timesEvaluated).to.eql(3)
    expect(notifiedValues).to.eql(['C'])
  })

  it('Should minimize evaluations when accessed from a computed', function () {
    let timesEvaluated = 0,
      data = observable('A'),
      pureComputedInstance = pureComputed(function () {
        ++timesEvaluated
        return data()
      }),
      computedInstance = computed(pureComputedInstance)

    // Should only have evaluated the pure computed once
    expect(computedInstance()).to.eql('A')
    expect(timesEvaluated).to.eql(1)

    // Updating the dependency evaluates it again
    data('B')
    expect(computedInstance()).to.eql('B')
    expect(timesEvaluated).to.eql(2)

    // Double check that disposing subscriptions puts the pure computed to sleep
    computedInstance.dispose()
    expect(data.getSubscriptionsCount()).to.eql(0)
  })

  it('Should evaluate latest value when chaining pure computeds', function () {
    const data = observable('A'),
      computed1 = pureComputed(data),
      computed2 = pureComputed(computed1)

    expect(computed2()).to.eql('A')

    data('B')
    expect(computed2()).to.eql('B')
  })

  it('Should minimize evaluations when chaining pure computeds', function () {
    let timesEvaluated = 0,
      data = observable('A'),
      computed1 = pureComputed(function () {
        return data() <= 'M'
      }), // This computed will return the same value for many values of data
      computed2 = pureComputed(function () {
        ++timesEvaluated
        return computed1()
      }) // This computed should only be re-evaluated when computed1 actually changes

    expect(computed2()).to.eql(true)
    expect(timesEvaluated).to.eql(1)

    data('B')
    expect(computed2()).to.eql(true)
    expect(timesEvaluated).to.eql(1)

    data('Z')
    expect(computed2()).to.eql(false)
    expect(timesEvaluated).to.eql(2)
  })

  it('Should be able to re-evaluate a sleeping computed that previously threw an exception', function () {
    const shouldThrow = observable(false),
      observableValue = observable(1),
      computedInstance = pureComputed(function () {
        if (shouldThrow()) {
          throw Error('Error during computed evaluation')
        } else {
          return observableValue()
        }
      })

    expect(computedInstance()).to.eql(1)

    observableValue(2)
    shouldThrow(true)
    expect(computedInstance).to.throw('Error during computed evaluation')

    shouldThrow(false)
    expect(computedInstance()).to.eql(2)
  })

  it('Should prevent recursive calling of read function', function () {
    // It doesn't really make sense to use the value of a pure computed within itself since there's no way to
    // prevent infinite recursion (a pure computed should never alter external state). So expect an error
    // if a pure computed is referenced recursively.
    const observableInstance = observable('A'),
      computedInstance = pureComputed(function () {
        return '' + observableInstance() + computedInstance()
      })

    // While sleeping
    expect(computedInstance).to.throw()

    // While awake
    observableInstance('B') // to ensure re-evaluation
    expect(function () {
      computedInstance(computedInstance)
    }).to.throw()
  })

  it('Should not add dependencies if disposed during evaluation while sleeping', function () {
    // This is a bit of a contrived example and likely won't occur in any actual applications.
    // See https://github.com/knockout/knockout/issues/1041
    let timesEvaluated = 0,
      observableToTriggerDisposal = observable(false),
      observableGivingValue = observable('A')
    const computedInstance = pureComputed(function () {
      if (observableToTriggerDisposal()) {
        computedInstance.dispose()
      }
      ++timesEvaluated
      return observableGivingValue()
    })

    // Check initial state
    expect(computedInstance()).to.eql('A')
    expect(timesEvaluated).to.eql(1)
    expect(computedInstance.getDependenciesCount()).to.eql(2)
    expect(computedInstance.getDependencies()).to.eql([observableToTriggerDisposal, observableGivingValue])

    // Now cause a disposal during evaluation
    observableToTriggerDisposal(true)
    expect(computedInstance()).to.eql('A')
    expect(timesEvaluated).to.eql(2)
    expect(computedInstance.getDependenciesCount()).to.eql(0)
    expect(computedInstance.getDependencies()).to.eql([])
  })

  it('Should support array tracking using extender', function () {
    let myArray = observable(['Alpha', 'Beta', 'Gamma']),
      myComputed = pureComputed(function () {
        return myArray().slice(-2)
      }).extend({ trackArrayChanges: true }),
      changelist

    expect(myComputed()).to.eql(['Beta', 'Gamma'])
    // The pure computed doesn't yet subscribe to the observable (it's still sleeping)
    expect(myArray.getSubscriptionsCount()).to.equal(0)

    const arrayChange = myComputed.subscribe(
      function (changes) {
        changelist = changes
      },
      null,
      'arrayChange'
    )
    expect(myArray.getSubscriptionsCount()).to.equal(1)

    myArray(['Alpha', 'Beta', 'Gamma', 'Delta'])
    expect(myComputed()).to.eql(['Gamma', 'Delta'])
    expect(changelist).to.eql([
      { status: 'deleted', value: 'Beta', index: 0 },
      { status: 'added', value: 'Delta', index: 1 }
    ])

    // It releases subscriptions when the arrayChange subscription is disposed
    arrayChange.dispose()
    expect(myArray.getSubscriptionsCount()).to.equal(0)
  })

  it('Should reevaluate if dependency was changed during awakening, but not otherwise', function () {
    // See https://github.com/knockout/knockout/issues/1975
    let data = observable(0),
      isEven = pureComputed(function () {
        return !(data() % 2)
      }),
      timesEvaluated = 0,
      pureComputedInstance = pureComputed(function () {
        ++timesEvaluated
        return isEven()
      }),
      subscription

    expect(pureComputedInstance()).to.eql(true)
    expect(timesEvaluated).to.eql(1)

    data(1)
    subscription = isEven.subscribe(function () {})
    expect(pureComputedInstance()).to.eql(false)
    expect(timesEvaluated).to.eql(2)
    subscription.dispose()

    data(3)
    subscription = isEven.subscribe(function () {})
    expect(pureComputedInstance()).to.eql(false)
    expect(timesEvaluated).to.eql(2)
  })

  it('Should wake with the correct value when a chained pure computed has side effects for its awake event', function () {
    const observableToUpdateOnAwake = observable(null)
    const computed1 = pureComputed(observableToUpdateOnAwake)
    const computed2 = pureComputed(computed1)

    computed1.subscribe(() => observableToUpdateOnAwake('foo'), null, 'awake')
    // Reading from the computed before subscribing caused the subscription to
    // ignore side-effects from the awake callback of chained pure computeds
    computed2()
    computed2.subscribe(() => {})
    expect(computed2()).to.eql('foo')
  })

  describe('Should maintain order of subscriptions', function () {
    let data, dataPureComputed

    function subscribeAndUpdate(computedInstance, newDataValue, expectedNotifiedValues) {
      const notifiedValues = new Array()
      computedInstance.subscribe(function (value) {
        notifiedValues.push(value)
      })

      data(newDataValue)
      expect(notifiedValues).to.eql(expectedNotifiedValues)
    }

    beforeEach(function () {
      data = observable('A')
      computed(data) // This computed ensures that the 'data' observable gets an id number right away

      // Because this is a pure computed, it will subscribe to 'data' in response to awakening, such
      // as being accessed from another computed. It will also then get a higher id number than 'data'.
      dataPureComputed = pureComputed(data)
    })

    // The following two tests demonstrate that the difference in the order of subscriptions can be tested.

    it('base behavior: order is pure computed, observable', function () {
      // This one accesses the base observable second, so that the first update happens after both values have been updated
      const computedInstance = pureComputed(function () {
        return dataPureComputed() + data()
      })
      subscribeAndUpdate(computedInstance, 'B', ['BB'])
    })

    it('base behavior: order is observable, pure computed', function () {
      // This one accesses the base observable first, which results in an update before 'dataPureComputed' has updated
      const computedInstance = pureComputed(function () {
        return data() + dataPureComputed()
      })
      subscribeAndUpdate(computedInstance, 'B', ['BA', 'BB'])
    })

    // This test sets up a pure computed using the first order and checks that the order stays correct
    // when awakened after being accessed, such that it's not re-evaluated.

    it('when awakening, without re-evaluation', function () {
      let timesEvaluated = 0,
        computedInstance = pureComputed(function () {
          ++timesEvaluated
          return dataPureComputed() + data()
        })

      // Access the pure computed while it is sleeping to evaluate it and record the dependencies
      expect(computedInstance()).to.eql('AA')
      expect(timesEvaluated).to.eql(1)

      // If the subscriptions happen in the wrong order, we'll get two notifications: 'AB', 'BB'
      subscribeAndUpdate(computedInstance, 'B', ['BB'])
      expect(timesEvaluated).to.eql(3)
    })
  })

  describe('Context', function () {
    it('Should not define initial evaluation', function () {
      let observableInstance = observable(1),
        evaluationCount = 0,
        computedInstance = pureComputed(function () {
          ++evaluationCount
          observableInstance() // for dependency
          return dependencyDetection.isInitial()
        })

      expect(evaluationCount).to.eql(0) // no evaluation yet
      expect(computedInstance()).to.eql(undefined) // isInitial is always undefined for a pure computed
      expect(evaluationCount).to.eql(1) // single evaluation

      observableInstance(2)
      computed(computedInstance) // wake up computed by subscribing to it
      expect(evaluationCount).to.eql(2) // which causes a second evaluation
      expect(computedInstance()).to.eql(undefined) // isInitial is still undefined
    })

    it('Should accurately report the number of dependencies', function () {
      let observable1 = observable(1),
        observable2 = observable(1),
        evaluationCount = 0,
        computedInstance = pureComputed(function () {
          // no dependencies at first
          expect(dependencyDetection.getDependenciesCount()).to.eql(0)
          expect(dependencyDetection.getDependencies()).to.eql([])
          // add a single dependency
          observable1()
          expect(dependencyDetection.getDependenciesCount()).to.eql(1)
          expect(dependencyDetection.getDependencies()).to.eql([observable1])
          // add a second one
          observable2()
          expect(dependencyDetection.getDependenciesCount()).to.eql(2)
          expect(dependencyDetection.getDependencies()).to.eql([observable1, observable2])
          // accessing observable again doesn't affect count
          observable1()
          expect(dependencyDetection.getDependenciesCount()).to.eql(2)
          expect(dependencyDetection.getDependencies()).to.eql([observable1, observable2])

          return ++evaluationCount
        })

      expect(computedInstance()).to.eql(1) // single evaluation
      expect(computedInstance.getDependenciesCount()).to.eql(2) // matches value from context
      expect(computedInstance.getDependencies()).to.eql([observable1, observable2])

      observable1(2)
      expect(computedInstance()).to.eql(2) // second evaluation
      expect(computedInstance.getDependenciesCount()).to.eql(2) // matches value from context
      expect(computedInstance.getDependencies()).to.eql([observable1, observable2])
    })
  })
})
