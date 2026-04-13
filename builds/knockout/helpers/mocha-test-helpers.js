import * as chai from 'chai'
import sinon from 'sinon'

const { expect } = chai

globalThis.chai = chai
globalThis.sinon = sinon
globalThis.expect = expect

function restoreAfter(cleanups, object, propertyName) {
  const originalValue = object[propertyName]
  cleanups.push(function () {
    object[propertyName] = originalValue
  })
}

function prepareTestNode() {
  const existingNode = document.getElementById('testNode')
  if (existingNode !== null && existingNode.parentNode) {
    existingNode.parentNode.removeChild(existingNode)
  }

  globalThis.testNode = document.createElement('div')
  globalThis.testNode.id = 'testNode'
  document.body.appendChild(globalThis.testNode)
  return globalThis.testNode
}

function setNodeText(node, text) {
  if ('textContent' in node) {
    node.textContent = text
  } else {
    node.innerText = text
  }
}

function nodeText(node) {
  return node.nodeType === Node.TEXT_NODE ? node.nodeValue : 'textContent' in node ? node.textContent : node.innerText
}

function cleanedHtml(node) {
  let html = node.innerHTML.toLowerCase().replace(/\r\n/g, '')
  html = html.replace(/(<!--.*?-->)\s*/g, '$1')
  return html.replace(/ __ko__\d+=\"(ko\d+|null)\"/g, '')
}

function detectIEVersion() {
  if (typeof document === 'undefined') {
    return undefined
  }

  let version = 3
  const div = document.createElement('div')
  const iElems = div.getElementsByTagName('i')

  while ((div.innerHTML = '<!--[if gt IE ' + ++version + ']><i></i><![endif]-->'), iElems[0]) {}
  return version > 4 ? version : undefined
}

function expectEqualOneOf(actual, expectedPossibilities) {
  const matches = expectedPossibilities.some(function (expected) { return chai.util.eql(actual, expected) })
  expect(matches, 'expected value to deeply equal one of the provided possibilities').to.equal(true)
}

function expectContainHtml(actual, expectedHtml, postProcessCleanedHtml) {
  let html = cleanedHtml(actual)
  const normalizedExpectedHtml = expectedHtml.replace(/(<!--.*?-->)\s*/g, '$1')
  if (postProcessCleanedHtml) {
    html = postProcessCleanedHtml(html)
  }
  expect(html).to.equal(normalizedExpectedHtml)
}

function expectContainText(actual, expectedText, ignoreSpaces) {
  let actualText = (nodeText(actual) || '').replace(/\r\n/g, '\n')
  let normalizedExpectedText = expectedText
  if (ignoreSpaces) {
    actualText = actualText.replace(/\s/g, '')
    normalizedExpectedText = expectedText.replace(/\s/g, '')
  }
  expect(actualText).to.equal(normalizedExpectedText)
}

function expectHaveOwnProperties(actual, expectedProperties) {
  const ownProperties = []
  for (const prop in actual) {
    if (Object.prototype.hasOwnProperty.call(actual, prop)) {
      ownProperties.push(prop)
    }
  }
  expect(ownProperties).to.deep.equal(expectedProperties)
}

function expectHaveTexts(actual, expectedTexts) {
  const texts = ko.utils.arrayMap(actual.childNodes, nodeText)
  expect(texts).to.deep.equal(expectedTexts)
}

function expectHaveValues(actual, expectedValues) {
  const values = ko.utils.arrayFilter(ko.utils.arrayMap(actual.childNodes, function (node) { return node.value }), function (value) { return value !== undefined })
  expect(values).to.deep.equal(expectedValues)
}

function expectHaveCheckedStates(actual, expectedValues) {
  const values = ko.utils.arrayMap(actual.childNodes, function (node) { return node.checked })
  expect(values).to.deep.equal(expectedValues)
}

function expectHaveSelectedValues(actual, expectedValues) {
  const selectedNodes = ko.utils.arrayFilter(actual.childNodes, function (node) { return node.selected })
  const selectedValues = ko.utils.arrayMap(selectedNodes, function (node) { return ko.selectExtensions.readValue(node) })
  expect(selectedValues).to.deep.equal(expectedValues)
}

function expectSpyCalled(spy) {
  expect(spy.called).to.equal(true)
}

function expectSpyNotCalled(spy) {
  expect(spy.called).to.equal(false)
}

function expectSpyCalledWith(spy) {
  const expectedArgs = Array.prototype.slice.call(arguments, 1)
  expect(spy.calledWith.apply(spy, expectedArgs)).to.equal(true)
}

function expectSpyNotCalledWith(spy) {
  const expectedArgs = Array.prototype.slice.call(arguments, 1)
  expect(spy.calledWith.apply(spy, expectedArgs)).to.equal(false)
}

globalThis.prepareTestNode = prepareTestNode
globalThis.restoreAfter = restoreAfter
globalThis.setNodeText = setNodeText
globalThis.nodeText = nodeText
globalThis.expectEqualOneOf = expectEqualOneOf
globalThis.expectContainHtml = expectContainHtml
globalThis.expectContainText = expectContainText
globalThis.expectHaveOwnProperties = expectHaveOwnProperties
globalThis.expectHaveTexts = expectHaveTexts
globalThis.expectHaveValues = expectHaveValues
globalThis.expectHaveCheckedStates = expectHaveCheckedStates
globalThis.expectHaveSelectedValues = expectHaveSelectedValues
globalThis.expectSpyCalled = expectSpyCalled
globalThis.expectSpyNotCalled = expectSpyNotCalled
globalThis.expectSpyCalledWith = expectSpyCalledWith
globalThis.expectSpyNotCalledWith = expectSpyNotCalledWith
globalThis.ieVersion = detectIEVersion()
globalThis.browserSupportsProtoAssignment = typeof Object.setPrototypeOf === 'function'

let disableJQueryUsage = true

function switchJQueryState() {
  ko.options.disableJQueryUsage = disableJQueryUsage = true
}

// Per-test cleanup array, reset each test via beforeEach/afterEach.
// Specs call the global `restoreAfter(obj, prop)` and `after(fn)` functions
// (previously accessed via `this.restoreAfter` / `this.after` in Mocha).
let _cleanups = []

globalThis.after = function (cleanup) {
  _cleanups.push(cleanup)
}

// Override the raw restoreAfter (3-arg) with a 2-arg version bound to _cleanups
globalThis.restoreAfter = function (object, propertyName) {
  restoreAfter(_cleanups, object, propertyName)
}

beforeEach(function () {
  _cleanups = []
  switchJQueryState()
  globalThis.after(function () {
    expect(disableJQueryUsage).to.equal(ko.options.disableJQueryUsage)
  })
})

afterEach(function () {
  for (let index = _cleanups.length - 1; index >= 0; index--) {
    _cleanups[index]()
  }
  _cleanups = []
})
