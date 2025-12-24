/* eslint semi: 0 */

import { options } from '@tko/utils'

import { removeNode, triggerEvent, extend } from '@tko/utils'

import { unwrap, observable as observableConstructor } from '@tko/observable'

import { computed as computedConstructor } from '@tko/computed'

import { MultiProvider } from '@tko/provider.multi'
import { DataBindProvider } from '@tko/provider.databind'
import { VirtualProvider } from '@tko/provider.virtual'

import { applyBindings, contextFor, applyBindingsToDescendants } from '../dist'

import { bindings as coreBindings } from '@tko/binding.core'

import '@tko/utils/helpers/jasmine-13-helper'

describe('Binding dependencies', function () {
  let bindingHandlers

  let testNode: HTMLElement
  beforeEach(function () {
    testNode = jasmine.prepareTestNode()
  })

  beforeEach(function () {
    const provider = new MultiProvider({ providers: [new DataBindProvider(), new VirtualProvider()] })
    options.bindingProviderInstance = provider
    bindingHandlers = provider.bindingHandlers
    bindingHandlers.set(coreBindings)
  })

  it('If the binding handler depends on an observable, invokes the init handler once and the update handler whenever a new value is available', function () {
    const observable = observableConstructor()
    const initPassedValues = new Array(),
      updatePassedValues = new Array()
    bindingHandlers.test = {
      init: function (element, valueAccessor) {
        initPassedValues.push(valueAccessor()())
      },
      update: function (element, valueAccessor) {
        updatePassedValues.push(valueAccessor()())
      }
    }
    testNode.innerHTML = "<div data-bind='test: myObservable'></div>"

    applyBindings({ myObservable: observable }, testNode)
    expect(initPassedValues.length).toEqual(1)
    expect(updatePassedValues.length).toEqual(1)
    expect(initPassedValues[0]).toBeUndefined()
    expect(updatePassedValues[0]).toBeUndefined()

    observable('A')
    expect(initPassedValues.length).toEqual(1)
    expect(updatePassedValues.length).toEqual(2)
    expect(updatePassedValues[1]).toEqual('A')
  })

  it('If the associated DOM element was removed by KO, handler subscriptions are disposed immediately', function () {
    const observable = observableConstructor('A')
    bindingHandlers.anyHandler = {
      update: function (element, valueAccessor) {
        valueAccessor()
      }
    }
    testNode.innerHTML = "<div data-bind='anyHandler: myObservable()'></div>"
    applyBindings({ myObservable: observable }, testNode)

    expect(observable.getSubscriptionsCount()).toEqual(1)

    removeNode(testNode)

    expect(observable.getSubscriptionsCount()).toEqual(0)
  })

  it('If the associated DOM element was removed independently of KO, handler subscriptions are disposed on the next evaluation', function () {
    const observable = observableConstructor('A')
    bindingHandlers.anyHandler = {
      update: function (element, valueAccessor) {
        valueAccessor()
      }
    }
    testNode.innerHTML = "<div data-bind='anyHandler: myObservable()'></div>"
    applyBindings({ myObservable: observable }, testNode)

    expect(observable.getSubscriptionsCount()).toEqual(1)

    testNode.parentNode?.removeChild(testNode)
    observable('B') // Force re-evaluation

    expect(observable.getSubscriptionsCount()).toEqual(0)
  })

  it('If the binding attribute involves an observable, re-invokes the bindings if the observable notifies a change', function () {
    const observable = observableConstructor({ message: 'hello' })
    const passedValues = new Array()
    bindingHandlers.test = {
      update: function (element, valueAccessor) {
        passedValues.push(valueAccessor())
      }
    }
    testNode.innerHTML = "<div data-bind='test: myObservable().message'></div>"

    applyBindings({ myObservable: observable }, testNode)
    expect(passedValues.length).toEqual(1)
    expect(passedValues[0]).toEqual('hello')

    observable({ message: 'goodbye' })
    expect(passedValues.length).toEqual(2)
    expect(passedValues[1]).toEqual('goodbye')
  })

  it('Should not reinvoke init for notifications triggered during first evaluation', function () {
    const observable = observableConstructor('A')
    let initCalls = 0
    bindingHandlers.test = {
      init: function (element, valueAccessor) {
        initCalls++

        const value = valueAccessor()

        // Read the observable (to set up a dependency on it), and then also write to it (to trigger re-eval of bindings)
        // This logic probably wouldn't be in init but might be indirectly invoked by init
        value()
        value('B')
      }
    }
    testNode.innerHTML = "<div data-bind='test: myObservable'></div>"

    applyBindings({ myObservable: observable }, testNode)
    expect(initCalls).toEqual(1)
  })

  it('Should not run update before init, even if an associated observable is updated by a different binding before init', function () {
    // Represents the "theoretical issue" posed by Ryan in comments on https://github.com/SteveSanderson/knockout/pull/193

    let observable = observableConstructor('A'),
      hasInittedSecondBinding = false,
      hasUpdatedSecondBinding = false
    bindingHandlers.test1 = {
      init: function (element, valueAccessor) {
        // Read the observable (to set up a dependency on it), and then also write to it (to trigger re-eval of bindings)
        // This logic probably wouldn't be in init but might be indirectly invoked by init
        const value = valueAccessor()
        value()
        value('B')
      }
    }
    bindingHandlers.test2 = {
      init: function () {
        hasInittedSecondBinding = true
      },
      update: function () {
        if (!hasInittedSecondBinding) {
          throw new Error("Called 'update' before 'init'")
        }
        hasUpdatedSecondBinding = true
      }
    }
    testNode.innerHTML = "<div data-bind='test1: myObservable, test2: true'></div>"

    applyBindings({ myObservable: observable }, testNode)
    expect(hasUpdatedSecondBinding).toEqual(true)
  })

  it('Should be able to get all updates to observables in both init and update', function () {
    let lastBoundValueInit, lastBoundValueUpdate
    bindingHandlers.testInit = {
      init: function (element, valueAccessor) {
        computedConstructor(function () {
          lastBoundValueInit = unwrap(valueAccessor())
        })
      }
    }
    bindingHandlers.testUpdate = {
      update: function (element, valueAccessor) {
        lastBoundValueUpdate = unwrap(valueAccessor())
      }
    }
    testNode.innerHTML = "<div data-bind='testInit: myProp()'></div><div data-bind='testUpdate: myProp()'></div>"
    const vm = observableConstructor({ myProp: observableConstructor('initial value') })
    applyBindings(vm, testNode)
    expect(lastBoundValueInit).toEqual('initial value')
    expect(lastBoundValueUpdate).toEqual('initial value')

    // update value of observable
    vm().myProp('second value')
    expect(lastBoundValueInit).toEqual('second value')
    expect(lastBoundValueUpdate).toEqual('second value')

    // update value of observable to another observable
    vm().myProp(observableConstructor('third value'))
    expect(lastBoundValueInit).toEqual('third value')
    expect(lastBoundValueUpdate).toEqual('third value')

    // update view model with brand-new property
    vm({
      myProp: function () {
        return 'fourth value'
      }
    })
    expect(lastBoundValueInit).toEqual('fourth value')
    expect(lastBoundValueUpdate).toEqual('fourth value')
  })

  it('Should not update sibling bindings if a binding is updated', function () {
    let countUpdates = 0,
      observable = observableConstructor(1)
    bindingHandlers.countingHandler = {
      update: function () {
        countUpdates++
      }
    }
    bindingHandlers.unwrappingHandler = {
      update: function (element, valueAccessor) {
        valueAccessor()
      }
    }
    testNode.innerHTML = "<div data-bind='countingHandler: true, unwrappingHandler: myObservable()'></div>"

    applyBindings({ myObservable: observable }, testNode)
    expect(countUpdates).toEqual(1)
    observable(3)
    expect(countUpdates).toEqual(1)
  })

  it('Should not subscribe to observables accessed in init function', function () {
    const observable = observableConstructor('A')
    bindingHandlers.test = {
      init: function (element, valueAccessor) {
        const value = valueAccessor()
        value()
      }
    }
    testNode.innerHTML = "<div data-bind='if: true'><div data-bind='test: myObservable'></div></div>"

    applyBindings({ myObservable: observable }, testNode)
    expect(observable.getSubscriptionsCount()).toEqual(0)
  })

  it('Should access latest value from extra binding when normal binding is updated', function () {
    delete bindingHandlers.nonexistentHandler
    let observable = observableConstructor(),
      updateValue
    const vm = { myObservable: observable, myNonObservable: 'first value' }
    bindingHandlers.existentHandler = {
      update: function (element, valueAccessor, allBindings) {
        valueAccessor()() // create dependency
        updateValue = allBindings.get('nonexistentHandler')
      }
    }
    testNode.innerHTML = "<div data-bind='existentHandler: myObservable, nonexistentHandler: myNonObservable'></div>"

    applyBindings(vm, testNode)
    expect(updateValue).toEqual('first value')
    vm.myNonObservable = 'second value'
    observable.notifySubscribers()
    expect(updateValue).toEqual('second value')
  })

  it('Should update a binding when its observable is modified in a sibling binding', function () {
    // Represents an issue brought up in the forum: https://groups.google.com/d/topic/knockoutjs/ROyhN7T2WJw/discussion
    let latestValue,
      observable1 = observableConstructor(1),
      observable2 = observableConstructor()
    bindingHandlers.updatedHandler = {
      update: function () {
        latestValue = observable2()
      }
    }
    bindingHandlers.modifyingHandler = {
      update: function () {
        observable2(observable1())
      }
    }
    // The order of the bindings matters: this tests that a later binding will update an earlier binding
    testNode.innerHTML = "<div data-bind='updatedHandler: true, modifyingHandler: true'></div>"

    applyBindings({}, testNode)
    expect(latestValue).toEqual(1)
    observable1(2)
    expect(latestValue).toEqual(2)
  })

  it('Should track observables accessed within the binding provider\'s "getBindingAccessor" function', function () {
    const observable = observableConstructor('substitute')

    class TestProvider extends DataBindProvider {
      override getBindingAccessors(node, bindingContext) {
        const bindings = super.getBindingAccessors(node, bindingContext)
        if (bindings && bindings.text) {
          const newValue = observable()
          bindings.text = () => newValue
        }
        return bindings
      }
    }

    const provider = new TestProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)

    testNode.innerHTML = '<div data-bind=\'text: "hello"\'></div>'
    applyBindings({}, testNode)

    expect(testNode).toContainText('substitute')
    expect(observable.getSubscriptionsCount()).toEqual(1)

    // update observable to update binding
    observable('new value')
    expect(testNode).toContainText('new value')
  })

  it('Should not cause updates if an observable accessed in a childrenComplete callback is changed', function () {
    bindingHandlers.test = {
      init: function () {
        return { controlsDescendantBindings: true }
      },
      update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        unwrap(valueAccessor())
        element.innerHTML = "<span data-bind='text: childprop'></span>"
        applyBindingsToDescendants(bindingContext, element)
      }
    }

    let callbackObservable = observableConstructor(1),
      bindingObservable = observableConstructor(1),
      callbacks = 0,
      vm = {
        childprop: 'child',
        bindingObservable: bindingObservable,
        callback: function () {
          callbackObservable()
          callbacks++
        }
      }

    testNode.innerHTML = "<div data-bind='test: bindingObservable, childrenComplete: callback'></div>"
    applyBindings(vm, testNode)
    expect(callbacks).toEqual(1)

    // Change the childprop which is not an observable so should not change the bound element
    vm.childprop = 'new child'
    expect(testNode.childNodes[0]).toContainText('child')

    // Update callback observable and check that the binding wasn't updated
    callbackObservable(2)
    expect(testNode.childNodes[0]).toContainText('child')

    // Update the bound observable and verify that the binding is now updated
    bindingObservable(2)
    expect(testNode.childNodes[0]).toContainText('new child')
    expect(callbacks).toEqual(2)
  })

  it('Should always use the latest value of a childrenComplete callback', function () {
    bindingHandlers.test = {
      init: function () {
        return { controlsDescendantBindings: true }
      },
      update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        const innerContext = bindingContext.createChildContext({ childprop: unwrap(valueAccessor()) })
        element.innerHTML = "<span data-bind='text: childprop'></span>"
        applyBindingsToDescendants(innerContext, element)
      }
    }

    const callbackSpy1 = jasmine.createSpy('callbackSpy1'),
      callbackSpy2 = jasmine.createSpy('callbackSpy2'),
      vm = { observable: observableConstructor('value'), callback: callbackSpy1 }

    testNode.innerHTML = "<div data-bind='test: observable, childrenComplete: callback'></div>"
    applyBindings(vm, testNode)
    expect(callbackSpy1).toHaveBeenCalled()

    callbackSpy1.reset()
    vm.callback = callbackSpy2

    vm.observable('new value')
    expect(testNode.childNodes[0]).toContainText('new value')
    expect(callbackSpy1).not.toHaveBeenCalled()
    expect(callbackSpy2).toHaveBeenCalled()
  })

  describe('Observable view models', function () {
    it('Should update bindings (including callbacks)', function () {
      let vm = observableConstructor(),
        clickedVM
      function checkVM(data) {
        clickedVM = data
      }
      testNode.innerHTML =
        "<div><input data-bind='value:someProp' /><input type='button' data-bind='click: checkVM' /></div>"
      vm({ someProp: 'My prop value', checkVM: checkVM })
      applyBindings(vm, testNode)
      expect(vm.getSubscriptionsCount()).toEqual(1)

      const child: Function = () => testNode.childNodes[0].childNodes[0] as HTMLInputElement
      expect(child().value).toEqual('My prop value')

      // a change to the input value should be written to the model
      child().value = 'some user-entered value'
      triggerEvent(child(), 'change')
      expect(vm().someProp).toEqual('some user-entered value')
      // a click should use correct view model
      triggerEvent(testNode.childNodes[0].childNodes[1] as Element, 'click')
      expect(clickedVM).toEqual(vm())

      // set the view-model to a new object
      vm({ someProp: observableConstructor('My new prop value'), checkVM: checkVM })
      expect(child().value).toEqual('My new prop value')

      // a change to the input value should be written to the new model
      child().value = 'some new user-entered value'
      triggerEvent(testNode.childNodes[0].childNodes[0] as Element, 'change')
      expect(vm().someProp()).toEqual('some new user-entered value')
      // a click should use correct view model
      triggerEvent(testNode.childNodes[0].childNodes[1] as Element, 'click')
      expect(clickedVM).toEqual(vm())

      // clear the element and the view-model (shouldn't be any errors) and the subscription should be cleared
      removeNode(testNode)
      vm(null)
      expect(vm.getSubscriptionsCount()).toEqual(0)
    })

    it("Should provide access to the view model's observable through $rawData", function () {
      const vm = observableConstructor('text')
      testNode.innerHTML = "<div data-bind='text:$data'></div>"
      applyBindings(vm, testNode)
      expect(testNode).toContainText('text')

      const context = contextFor(testNode)
      expect(context.$data).toEqual('text')
      expect(context.$rawData).toBe(vm)
    })

    it('Should set $rawData to the observable returned from a function', function () {
      const vm = observableConstructor('text')
      testNode.innerHTML = "<div data-bind='text:$data'></div>"
      applyBindings(function () {
        return vm
      }, testNode)
      expect(testNode).toContainText('text')

      const context = contextFor(testNode)
      expect(context.$data).toEqual('text')
      expect(context.$rawData).toBe(vm)
    })

    it('Should set $rawData to the view model if a function unwraps the observable view model', function () {
      const vm = observableConstructor('text')
      testNode.innerHTML = "<div data-bind='text:$data'></div>"
      applyBindings(function () {
        return vm()
      }, testNode)
      expect(testNode).toContainText('text')

      const context = contextFor(testNode)
      expect(context.$data).toEqual('text')
      expect(context.$rawData).toBe('text')

      // Updating view model updates bindings and context
      vm('new text')
      expect(testNode).toContainText('new text')
      expect(context.$data).toEqual('new text')
      expect(context.$rawData).toBe('new text')
    })

    it('Should dispose view model subscription on next update when bound node is removed outside of KO', function () {
      const vm = observableConstructor('text')
      testNode.innerHTML = "<div data-bind='text:$data'></div>"
      applyBindings(vm, testNode)
      expect(vm.getSubscriptionsCount()).toEqual(1)

      // remove the element and re-set the view-model; the subscription should be cleared
      expect(testNode.parentElement).not.toBeNull()
      testNode.parentNode?.removeChild(testNode)
      vm(null)
      expect(vm.getSubscriptionsCount()).toEqual(0)
    })

    it('Should update all child contexts (including values copied from the parent)', function () {
      bindingHandlers.setChildContext = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
          applyBindingsToDescendants(
            bindingContext.createChildContext(function () {
              return unwrap(valueAccessor())
            }),
            element
          )
          return { controlsDescendantBindings: true }
        }
      }

      testNode.innerHTML =
        "<div data-bind='setChildContext:obj1'><span data-bind='text:prop1'></span><span data-bind='text:$root.prop2'></span></div>"
      const vm = observableConstructor({ obj1: { prop1: 'First ' }, prop2: 'view model' })
      applyBindings(vm, testNode)
      expect(testNode).toContainText('First view model')

      // change view model to new object
      vm({ obj1: { prop1: 'Second view ' }, prop2: 'model' })
      expect(testNode).toContainText('Second view model')

      // change it again
      vm({ obj1: { prop1: 'Third view model' }, prop2: '' })
      expect(testNode).toContainText('Third view model')

      // clear the element and the view-model (shouldn't be any errors) and the subscription should be cleared
      removeNode(testNode)
      vm(null)
      expect(vm.getSubscriptionsCount()).toEqual(0)
    })

    it('Should update all extended contexts (including values copied from the parent)', function () {
      bindingHandlers.withProperties = {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
          const innerBindingContext = bindingContext.extend(valueAccessor)
          applyBindingsToDescendants(innerBindingContext, element)
          return { controlsDescendantBindings: true }
        }
      }

      testNode.innerHTML =
        "<div data-bind='withProperties: obj1'><span data-bind='text:prop1'></span><span data-bind='text:prop2'></span><span data-bind='text:$rawData().prop3'></span></div>"
      const vm = observableConstructor({ obj1: { prop1: 'First ' }, prop2: 'view ', prop3: 'model' })
      applyBindings(vm, testNode)
      expect(testNode).toContainText('First view model')

      // change view model to new object
      vm({ obj1: { prop1: 'Second view ' }, prop2: 'model', prop3: '' })
      expect(testNode).toContainText('Second view model')

      // change it again
      vm({ obj1: { prop1: '' }, prop2: '', prop3: 'Third view model' })
      expect(testNode).toContainText('Third view model')

      // clear the element and the view-model (shouldn't be any errors) and the subscription should be cleared
      removeNode(testNode)
      vm(null)
      expect(vm.getSubscriptionsCount()).toEqual(0)
    })

    it('Should maintain correct $rawData in extended context when parent is bound to a function that returns an observable view model', function () {
      bindingHandlers.extended = {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
          applyBindingsToDescendants(bindingContext.extend(valueAccessor), element)
          return { controlsDescendantBindings: true }
        }
      }

      const vm1 = observableConstructor('vm1'),
        vm2 = observableConstructor('vm2'),
        whichVm = observableConstructor(vm1)
      testNode.innerHTML = "<div data-bind='extended: {}'><div data-bind='text: $data'></div></div>"
      applyBindings(function () {
        return whichVm()
      }, testNode)
      expect(testNode).toContainText('vm1')

      const parentContext = contextFor(testNode),
        childContext = contextFor(testNode.childNodes[0].childNodes[0])

      expect(parentContext.$data).toEqual('vm1')
      expect(parentContext.$rawData).toBe(vm1)

      expect(childContext).not.toBe(parentContext)
      expect(childContext.$data).toEqual('vm1')
      expect(childContext.$rawData).toBe(vm1)

      // Updating view model updates bindings and context
      whichVm(vm2)
      expect(testNode).toContainText('vm2')
      expect(childContext.$data).toEqual('vm2')
      expect(childContext.$rawData).toBe(vm2)
    })

    it('Should update an extended child context', function () {
      bindingHandlers.withProperties = {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
          const childBindingContext = bindingContext.createChildContext(null, null, function (context) {
            extend(context, valueAccessor())
          })
          applyBindingsToDescendants(childBindingContext, element)
          return { controlsDescendantBindings: true }
        }
      }

      testNode.innerHTML =
        "<div data-bind='withProperties: obj1'><span data-bind='text:prop1'></span><span data-bind='text:$parent.prop2'></span></div>"
      const vm = observableConstructor({ obj1: { prop1: 'First ' }, prop2: 'view model' })
      applyBindings(vm, testNode)
      expect(testNode).toContainText('First view model')

      // ch ange view model to new object
      vm({ obj1: { prop1: 'Second view ' }, prop2: 'model' })
      expect(testNode).toContainText('Second view model')

      // change it again
      vm({ obj1: { prop1: 'Third view model' }, prop2: '' })
      expect(testNode).toContainText('Third view model')

      // clear the element and the view-model (shouldn't be any errors) and the subscription should be cleared
      removeNode(testNode)
      vm(null)
      expect(vm.getSubscriptionsCount()).toEqual(0)
    })
  })

  describe('Order', function () {
    let bindingOrder
    beforeEach(function () {
      bindingOrder = new Array()

      function makeBinding(name) {
        return {
          init: function () {
            bindingOrder.push(name)
          }
        }
      }
      bindingHandlers.test1 = makeBinding(1)
      bindingHandlers.test2 = makeBinding(2)
      bindingHandlers.test3 = makeBinding(3)
      bindingHandlers.test4 = makeBinding(4)
    })

    it('Should default to the order in the binding', function () {
      testNode.innerHTML = "<div data-bind='test1, test2, test3'></div>"
      applyBindings(null, testNode)
      expect(bindingOrder).toEqual([1, 2, 3])
    })

    it('Should be based on binding\'s "after" values, which override the default binding order', function () {
      bindingHandlers.test2.after = ['test1']
      bindingHandlers.test3.after = ['test2']
      testNode.innerHTML = "<div data-bind='test3, test2, test1'></div>"
      applyBindings(null, testNode)
      expect(bindingOrder).toEqual([1, 2, 3])
    })

    it('Should leave bindings without an "after" value where they are', function () {
      // This test is set up to be unambiguous, because only test1 and test2 are reordered
      // (they have the dependency between them) and test3 is left alone.
      bindingHandlers.test2.after = ['test1']
      testNode.innerHTML = "<div data-bind='test2, test1, test3'></div>"
      applyBindings(null, testNode)
      expect(bindingOrder).toEqual([1, 2, 3])
    })

    it('Should leave bindings without an "after" value where they are (extended)', function () {
      // This test is ambiguous, because test3 could either be before test1 or after test2.
      // So we accept either result.
      bindingHandlers.test2.after = ['test1']
      testNode.innerHTML = "<div data-bind='test2, test3, test1'></div>"
      applyBindings(null, testNode)
      expect(bindingOrder).toEqualOneOf([
        [1, 2, 3],
        [3, 1, 2]
      ])
    })

    it('Should throw an error if bindings have a cyclic dependency', function () {
      // We also verify that test4 and unknownBinding don't appear in the error message, because they aren't part of the cycle
      bindingHandlers.test1.after = ['test3']
      bindingHandlers.test2.after = ['test1']
      bindingHandlers.test3.after = ['test4', 'test2']
      bindingHandlers.test4.after = new Array()
      testNode.innerHTML = "<div data-bind='test1, unknownBinding, test2, test4, test3'></div>"

      expect(function () {
        applyBindings(null, testNode)
      }).toThrow('Cannot combine the following bindings, because they have a cyclic dependency: test1, test3, test2')
    })
  })
})
