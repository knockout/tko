;(function (global) {
  const Assertion = chai.Assertion
  let activeClock = null
  let currentContext = null

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

    global.testNode = document.createElement('div')
    global.testNode.id = 'testNode'
    document.body.appendChild(global.testNode)
    return global.testNode
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

  function createSpy(name) {
    const spy = sinon.stub()

    Object.defineProperties(spy, {
      calls: {
        get: function () {
          return spy.getCalls()
        }
      },
      argsForCall: {
        get: function () {
          return spy.getCalls().map(function (call) { return call.args })
        }
      }
    })

    if (name) {
      spy.displayName = name
    }

    spy.reset = spy.resetHistory.bind(spy)
    spy.andCallFake = spy.callsFake.bind(spy)
    spy.andReturn = spy.returns.bind(spy)
    return spy
  }

  const Clock = {
    mockScheduler: function (callback) {
      setTimeout(callback, 0)
    },
    useMock: function () {
      if (activeClock) {
        activeClock.restore()
      }
      activeClock = sinon.useFakeTimers()
      return activeClock
    },
    useMockForTasks: function () {
      this.useMock()
      if (!currentContext) {
        throw new Error('Clock.useMockForTasks must run inside a test')
      }
      if (ko.options.taskScheduler !== this.mockScheduler) {
        currentContext.restoreAfter(ko.options, 'taskScheduler')
        ko.options.taskScheduler = function (callback) { setTimeout(callback, 0) }
      }
    },
    tick: function (millis) {
      if (!activeClock) {
        throw new Error('Clock.tick called without an active fake clock')
      }
      activeClock.tick(millis)
    },
    reset: function () {
      if (activeClock) {
        activeClock.restore()
        activeClock = null
      }
    }
  }

  function expectEqualOneOf(actual, expectedPossibilities) {
    const matches = expectedPossibilities.some(function (expected) { return chai.util.eql(actual, expected) })
    new Assertion(matches, 'expected value to deeply equal one of the provided possibilities').to.equal(true)
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

  global.prepareTestNode = prepareTestNode
  global.restoreAfter = restoreAfter
  global.setNodeText = setNodeText
  global.nodeText = nodeText
  global.expectEqualOneOf = expectEqualOneOf
  global.expectContainHtml = expectContainHtml
  global.expectContainText = expectContainText
  global.expectHaveOwnProperties = expectHaveOwnProperties
  global.expectHaveTexts = expectHaveTexts
  global.expectHaveValues = expectHaveValues
  global.expectHaveCheckedStates = expectHaveCheckedStates
  global.expectHaveSelectedValues = expectHaveSelectedValues
  global.expectSpyCalled = expectSpyCalled
  global.expectSpyNotCalled = expectSpyNotCalled
  global.expectSpyCalledWith = expectSpyCalledWith
  global.expectSpyNotCalledWith = expectSpyNotCalledWith
  global.createSpy = createSpy
  global.Clock = Clock
  global.ieVersion = detectIEVersion()
  global.browserSupportsProtoAssignment = typeof Object.setPrototypeOf === 'function'

  const KARMA_STRING = '__karma__'
  let disableJQueryUsage = true

  function switchJQueryState() {
    if (global[KARMA_STRING] && global[KARMA_STRING].config.args.includes('--noJQuery')) {
      ko.options.disableJQueryUsage = disableJQueryUsage = true
    } else {
      ko.options.disableJQueryUsage = disableJQueryUsage = false
    }
  }

  beforeEach(function () {
    const ctx = this
    const cleanups = []
    currentContext = ctx
    ctx.__tkoCleanups = cleanups
    function after(cleanup) {
      cleanups.push(cleanup)
    }
    function restore(object, propertyName) {
      restoreAfter(cleanups, object, propertyName)
    }
    ctx.after = after
    ctx.restoreAfter = restore
    switchJQueryState()
    ctx.after(function () {
      expect(disableJQueryUsage).to.equal(ko.options.disableJQueryUsage)
    })
    ctx.after(function () {
      if (activeClock) {
        activeClock.restore()
        activeClock = null
      }
    })
  })

  afterEach(function () {
    const ctx = this
    if (ctx && ctx.__tkoCleanups) {
      for (let index = ctx.__tkoCleanups.length - 1; index >= 0; index--) {
        ctx.__tkoCleanups[index]()
      }
      delete ctx.__tkoCleanups
    }
    if (ctx) {
      delete ctx.after
      delete ctx.restoreAfter
    }
    currentContext = null
  })
})(window)
