import { expect } from 'chai'

import { applyBindings } from '@tko/bind'

import { observable, observableArray } from '@tko/observable'

import { DataBindProvider } from '@tko/provider.databind'

import { registerEventHandler, options, selectExtensions } from '@tko/utils'

import { bindings as coreBindings } from '../dist'

import type { ObservableArray } from '@tko/observable'

import { expectContainText, nodeText, prepareTestNode } from '../../utils/helpers/mocha-test-helpers'
import { isHappyDom } from '../../utils/helpers/test-env'

function expectArrayEqual(actual: Array<unknown>, expected: Array<unknown>) {
  expect(actual.length).to.equal(expected.length)
  actual.forEach((value, index) => expect(value).to.equal(expected[index]))
}

function expectHaveTexts(node: Node, expectedTexts: Array<unknown>) {
  expectArrayEqual(Array.from(node.childNodes, nodeText), expectedTexts)
}

function expectHaveValues(node: Node, expectedValues: Array<unknown>) {
  expectArrayEqual(
    Array.from(node.childNodes, child => (child as any).value).filter(value => value !== undefined),
    expectedValues
  )
}

function expectHaveSelectedValues(node: Node, expectedValues: Array<unknown>) {
  expectArrayEqual(
    Array.from(node.childNodes)
      .filter(child => (child as HTMLOptionElement).selected)
      .map(child => selectExtensions.readValue(child as HTMLElement)),
    expectedValues
  )
}

describe('Binding: Options', function () {
  let testNode: HTMLElement

  beforeEach(function () {
    testNode = prepareTestNode()
  })

  beforeEach(function () {
    const provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
  })

  it('Should only be applicable to SELECT nodes', function () {
    let threw = false
    testNode.innerHTML = "<input data-bind='options:{}' />"
    try {
      applyBindings({}, testNode)
    } catch (ex) {
      threw = true
    }
    expect(threw).to.equal(true)
  })

  it("Should set the SELECT node's options set to match the model value", function () {
    const observable = observableArray(['A', 'B', 'C'])
    testNode.innerHTML = "<select data-bind='options:myValues'><option>should be deleted</option></select>"
    applyBindings({ myValues: observable }, testNode)
    expectHaveTexts(testNode.childNodes[0], ['A', 'B', 'C'])
  })

  it('Should accept optionsText and optionsValue params to display subproperties of the model values', function () {
    const modelValues = observableArray([
      { name: 'bob', id: observable(6) },
      { name: observable('frank'), id: 13 }
    ])
    testNode.innerHTML =
      '<select data-bind=\'options:myValues, optionsText: "name", optionsValue: "id"\'><option>should be deleted</option></select>'
    applyBindings({ myValues: modelValues }, testNode)
    expectHaveTexts(testNode.childNodes[0], ['bob', 'frank'])
    expectHaveValues(testNode.childNodes[0], ['6', '13'])
  })

  it('Should accept function in optionsText param to display subproperties of the model values', function () {
    const modelValues = observableArray([
      { name: 'bob', job: 'manager' },
      { name: 'frank', job: 'coder & tester' }
    ])
    testNode.innerHTML =
      "<select data-bind='options:myValues, optionsText: textFn'><option>should be deleted</option></select>"
    applyBindings(
      {
        myValues: modelValues,
        textFn: function (v) {
          return v.name + ' (' + v.job + ')'
        }
      },
      testNode
    )
    expectHaveTexts(testNode.childNodes[0], ['bob (manager)', 'frank (coder & tester)'])
  })

  it('Should accept lambda in optionsText param to compute text from model values', function () {
    const modelValues = observableArray([{ name: 'bob' }, { name: 'frank' }])
    testNode.innerHTML =
      "<select data-bind='options: myValues, optionsText: val => val.name.toUpperCase()'><option>should be deleted</option></select>"
    applyBindings({ myValues: modelValues }, testNode)
    expectHaveTexts(testNode.childNodes[0], ['BOB', 'FRANK'])
  })

  it('Should accept a function in optionsValue param to select subproperties of the model values (and use that for the option text)', function () {
    const modelValues = observableArray([
      { name: 'bob', job: 'manager' },
      { name: 'frank', job: 'coder & tester' }
    ])
    testNode.innerHTML =
      "<select data-bind='options: myValues, optionsValue: optionsFn'><option>should be deleted</option></select>"
    applyBindings(
      {
        myValues: modelValues,
        optionsFn: function (v) {
          return v.name + ' (' + v.job + ')'
        }
      },
      testNode
    )
    expectHaveValues(testNode.childNodes[0], ['bob (manager)', 'frank (coder & tester)'])
    expectHaveTexts(testNode.childNodes[0], ['bob (manager)', 'frank (coder & tester)'])
  })

  it('Should exclude any items marked as destroyed', function () {
    const modelValues = observableArray([{ name: 'bob', _destroy: true }, { name: 'frank' }])
    testNode.innerHTML = '<select data-bind=\'options: myValues, optionsValue: "name"\'></select>'
    applyBindings({ myValues: modelValues }, testNode)
    expectHaveValues(testNode.childNodes[0], ['frank'])
  })

  it('Should include items marked as destroyed if optionsIncludeDestroyed is set', function () {
    const modelValues = observableArray([{ name: 'bob', _destroy: true }, { name: 'frank' }])
    testNode.innerHTML =
      '<select data-bind=\'options: myValues, optionsValue: "name", optionsIncludeDestroyed: true\'></select>'
    applyBindings({ myValues: modelValues }, testNode)
    expectHaveValues(testNode.childNodes[0], ['bob', 'frank'])
  })

  it("Should update the SELECT node's options if the model changes", function () {
    const observable = observableArray(['A', 'B', 'C'])
    testNode.innerHTML = "<select data-bind='options:myValues'><option>should be deleted</option></select>"
    applyBindings({ myValues: observable }, testNode)
    observable.splice(1, 1)
    expectHaveTexts(testNode.childNodes[0], ['A', 'C'])
  })

  it("Should retain as much selection as possible when changing the SELECT node's options", function () {
    const observable = observableArray(['A', 'B', 'C'])
    testNode.innerHTML = "<select data-bind='options:myValues' multiple='multiple'></select>"
    applyBindings({ myValues: observable }, testNode)
    ;(testNode.childNodes[0] as HTMLSelectElement).options[1].selected = true
    expectHaveSelectedValues(testNode.childNodes[0], ['B'])
    observable(['B', 'C', 'A'])
    expectHaveSelectedValues(testNode.childNodes[0], ['B'])
  })

  it('Should retain selection when replacing the options data with new objects that have the same "value"', function () {
    const observable = observableArray([{ x: 'A' }, { x: 'B' }, { x: 'C' }])
    testNode.innerHTML = "<select data-bind='options:myValues, optionsValue:\"x\"' multiple='multiple'></select>"
    applyBindings({ myValues: observable }, testNode)
    ;(testNode.childNodes[0] as HTMLSelectElement).options[1].selected = true
    expectHaveSelectedValues(testNode.childNodes[0], ['B'])
    observable([{ x: 'A' }, { x: 'C' }, { x: 'B' }])
    expectHaveSelectedValues(testNode.childNodes[0], ['B'])
  })

  it('Should select first option when removing the selected option and the original first option', function () {
    testNode.innerHTML = "<select data-bind=\"options: filterValues, optionsText: 'x', optionsValue: 'x'\">"
    const viewModel = { filterValues: observableArray([{ x: 1 }, { x: 2 }, { x: 3 }]) }
    applyBindings(viewModel, testNode)
    ;(testNode.childNodes[0] as HTMLSelectElement).options[1].selected = true
    expectHaveSelectedValues(testNode.childNodes[0], [2])

    viewModel.filterValues.splice(0, 2, { x: 4 })
    expectHaveSelectedValues(testNode.childNodes[0], [4])
  })

  it('Should select caption by default and retain selection when adding multiple items', function (ctx: any) {
    if (isHappyDom()) return ctx.skip('happy-dom: <select> auto-selection semantics diverge')
    testNode.innerHTML = '<select data-bind="options: filterValues, optionsCaption: \'foo\'">'
    const viewModel = { filterValues: observableArray(undefined) }
    applyBindings(viewModel, testNode)
    expectHaveSelectedValues(testNode.childNodes[0], [undefined])
    const captionElement = (testNode.childNodes[0] as HTMLSelectElement).options[0]

    viewModel.filterValues.push('1')
    viewModel.filterValues.push('2')
    expectHaveSelectedValues(testNode.childNodes[0], [undefined])

    expect((testNode.childNodes[0] as HTMLSelectElement).options[0]).to.equal(captionElement)
  })

  it('Should trigger a change event when the options selection is populated or changed by modifying the options data (single select)', function (ctx: any) {
    if (isHappyDom()) return ctx.skip('happy-dom: selectedIndex does not follow reordered <option>')
    let myObservable: ObservableArray<string | number> = observableArray<string | number>(['A', 'B', 'C']),
      changeHandlerFireCount = 0
    testNode.innerHTML = "<select data-bind='options:myValues'></select>"
    registerEventHandler(testNode.childNodes[0] as HTMLSelectElement, 'change', function () {
      changeHandlerFireCount++
    })
    applyBindings({ myValues: myObservable }, testNode)
    expect((testNode.childNodes[0] as HTMLSelectElement).selectedIndex).to.equal(0)
    expect(changeHandlerFireCount).to.equal(1)

    myObservable(['B', 'C', 'A'])
    expect((testNode.childNodes[0] as HTMLSelectElement).selectedIndex).to.equal(2)
    expect(changeHandlerFireCount).to.equal(1)

    myObservable(['D', 'E'])
    expect((testNode.childNodes[0] as HTMLSelectElement).selectedIndex).to.equal(0)
    expect(changeHandlerFireCount).to.equal(2)

    myObservable([])
    expect((testNode.childNodes[0] as HTMLSelectElement).selectedIndex).to.equal(-1)
    expect(changeHandlerFireCount).to.equal(3)

    myObservable([1, 2, 3])
    expect((testNode.childNodes[0] as HTMLSelectElement).selectedIndex).to.equal(0)
    expect(changeHandlerFireCount).to.equal(4)
  })

  it('Should trigger a change event when the options selection is changed by modifying the options data (multiple select)', function () {
    let myObservable: ObservableArray<any> = observableArray(['A', 'B', 'C']),
      changeHandlerFireCount = 0
    testNode.innerHTML = "<select data-bind='options:myValues' multiple='multiple'></select>"
    registerEventHandler(testNode.childNodes[0] as HTMLSelectElement, 'change', function () {
      changeHandlerFireCount++
    })
    applyBindings({ myValues: myObservable }, testNode)
    expect(changeHandlerFireCount).to.equal(0)
    ;(testNode.childNodes[0] as HTMLSelectElement).options[0].selected = true
    expectHaveSelectedValues(testNode.childNodes[0], ['A'])
    myObservable(['B', 'C', 'A'])
    expectHaveSelectedValues(testNode.childNodes[0], ['A'])
    expect(changeHandlerFireCount).to.equal(0)
    ;(testNode.childNodes[0] as HTMLSelectElement).options[0].selected = true
    expectHaveSelectedValues(testNode.childNodes[0], ['B', 'A'])
    myObservable(['C', 'A'])
    expectHaveSelectedValues(testNode.childNodes[0], ['A'])
    expect(changeHandlerFireCount).to.equal(1)

    myObservable(['D', 'E'])
    expectHaveSelectedValues(testNode.childNodes[0], [])
    expect(changeHandlerFireCount).to.equal(2)

    myObservable([])
    expect(changeHandlerFireCount).to.equal(2)

    myObservable([observable('X'), observable('Y')])
    expect(changeHandlerFireCount).to.equal(2)
    ;(testNode.childNodes[0] as HTMLSelectElement).options[0].selected = (
      testNode.childNodes[0] as HTMLSelectElement
    ).options[1].selected = true
    expectHaveSelectedValues(testNode.childNodes[0], ['X', 'Y'])

    myObservable()[1]('Z')
    expectHaveSelectedValues(testNode.childNodes[0], ['X'])
    expect(changeHandlerFireCount).to.equal(3)
  })

  it('Should place a caption at the top of the options list and display it when the model value is undefined', function () {
    testNode.innerHTML = '<select data-bind=\'options:["A", "B"], optionsCaption: "Select one..."\'></select>'
    applyBindings({}, testNode)
    expectHaveTexts(testNode.childNodes[0], ['Select one...', 'A', 'B'])
  })

  it('Should not include the caption if the options value is null', function () {
    testNode.innerHTML = '<select data-bind=\'options: null, optionsCaption: "Select one..."\'></select>'
    applyBindings({}, testNode)
    expectHaveTexts(testNode.childNodes[0], [])
  })

  it('Should not include the caption if the optionsCaption value is null', function () {
    testNode.innerHTML = '<select data-bind=\'options: ["A", "B"], optionsCaption: null\'></select>'
    applyBindings({}, testNode)
    expectHaveTexts(testNode.childNodes[0], ['A', 'B'])
  })

  it('Should not include the caption if the optionsCaption value is undefined', function () {
    testNode.innerHTML = '<select data-bind=\'options: ["A", "B"], optionsCaption: test\'></select>'
    applyBindings({ test: observable() }, testNode)
    expectHaveTexts(testNode.childNodes[0], ['A', 'B'])
  })

  it("Should include a caption even if it's blank", function () {
    testNode.innerHTML = '<select data-bind=\'options: ["A","B"], optionsCaption: ""\'></select>'
    applyBindings({}, testNode)
    expectHaveTexts(testNode.childNodes[0], ['', 'A', 'B'])
  })

  it('Should allow the caption to be given by an observable, and update it when the model value changes (without affecting selection)', function (ctx: any) {
    if (isHappyDom()) return ctx.skip('happy-dom: element.options[selectedIndex] can be undefined')
    const myCaption = observable('Initial caption')
    testNode.innerHTML = '<select data-bind=\'options:["A", "B"], optionsCaption: myCaption\'></select>'
    applyBindings({ myCaption: myCaption }, testNode)
    ;(testNode.childNodes[0] as HTMLSelectElement).options[2].selected = true
    expect((testNode.childNodes[0] as HTMLSelectElement).selectedIndex).to.equal(2)
    expectHaveTexts(testNode.childNodes[0], ['Initial caption', 'A', 'B'])

    myCaption('New caption')
    expect((testNode.childNodes[0] as HTMLSelectElement).selectedIndex).to.equal(2)
    expectHaveTexts(testNode.childNodes[0], ['New caption', 'A', 'B'])

    myCaption(null)
    expect((testNode.childNodes[0] as HTMLSelectElement).selectedIndex).to.equal(1)
    expectHaveTexts(testNode.childNodes[0], ['A', 'B'])
  })

  it('Should allow the option text to be given by an observable and update it when the model changes without affecting selection', function () {
    const people = [
      { name: observable('Annie'), id: 'A' },
      { name: observable('Bert'), id: 'B' }
    ]
    testNode.innerHTML =
      "<select data-bind=\"options: people, optionsText: 'name', optionsValue: 'id', optionsCaption: '-'\"></select>"
    applyBindings({ people: people }, testNode)
    ;(testNode.childNodes[0] as HTMLSelectElement).options[2].selected = true

    expect((testNode.childNodes[0] as HTMLSelectElement).selectedIndex).to.equal(2)
    expectHaveTexts(testNode.childNodes[0], ['-', 'Annie', 'Bert'])

    people[1].name('Bob')
    expect((testNode.childNodes[0] as HTMLSelectElement).selectedIndex).to.equal(2)
    expectHaveTexts(testNode.childNodes[0], ['-', 'Annie', 'Bob'])
  })

  it('Should call an optionsAfterRender callback function and not cause updates if an observable accessed in the callback is changed', function () {
    testNode.innerHTML =
      '<select data-bind="options: someItems, optionsText: \'childprop\', optionsAfterRender: callback"></select>'
    let callbackObservable = observable(1),
      someItems: any = observableArray([{ childprop: 'first child' }]),
      callbacks = 0
    applyBindings(
      {
        someItems: someItems,
        callback: function () {
          callbackObservable()
          callbacks++
        }
      },
      testNode
    )
    expect(callbacks).to.equal(1)

    someItems().push({ childprop: 'hidden child' })
    expectContainText(testNode.childNodes[0], 'first child')
    callbackObservable(2)
    expectContainText(testNode.childNodes[0], 'first child')
    someItems.valueHasMutated()
    expectContainText(testNode.childNodes[0], 'first childhidden child')
    expect(callbacks).to.equal(2)
  })

  it('Should ignore the optionsAfterRender binding if the callback was not provided or not a function', function () {
    testNode.innerHTML =
      '<select data-bind="options: someItems, optionsText: \'childprop\', optionsAfterRender: callback"></select>'
    const someItems = observableArray([{ childprop: 'first child' }])

    applyBindings({ someItems: someItems, callback: null }, testNode)
    expectContainText(testNode.childNodes[0], 'first child')
  })
})
