;(function (global) {
  const Assertion = chai.Assertion
  let activeClock = null
  let currentContext = null

  function arrayEqual(actual, expected) {
    return actual.length === expected.length && actual.every(function (value, index) { return chai.util.eql(value, expected[index]) })
  }

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

  chai.use(function (_chai, utils) {
    function assertEqualOneOf(ctx, expectedPossibilities) {
      const actual = utils.flag(ctx, 'object')
      const matches = expectedPossibilities.some(function (expected) { return chai.util.eql(actual, expected) })
      ctx.assert(matches, 'expected #{this} to equal one of #{exp}', 'expected #{this} not to equal one of #{exp}', expectedPossibilities, actual, true)
    }

    Assertion.addMethod('toBe', function (expected) {
      this.assert(utils.flag(this, 'object') === expected, 'expected #{this} to be #{exp}', 'expected #{this} not to be #{exp}', expected, utils.flag(this, 'object'), true)
    })

    Assertion.addMethod('toEqual', function (expected) {
      this.assert(chai.util.eql(utils.flag(this, 'object'), expected), 'expected #{this} to deeply equal #{exp}', 'expected #{this} not to deeply equal #{exp}', expected, utils.flag(this, 'object'), true)
    })

    Assertion.addMethod('toEqualOneOf', function (expectedPossibilities) {
      assertEqualOneOf(this, expectedPossibilities)
    })

    Assertion.addMethod('toBeUndefined', function () {
      this.assert(utils.flag(this, 'object') === undefined, 'expected #{this} to be undefined', 'expected #{this} not to be undefined')
    })

    Assertion.addMethod('toBeDefined', function () {
      this.assert(utils.flag(this, 'object') !== undefined, 'expected #{this} to be defined', 'expected #{this} not to be defined')
    })

    Assertion.addMethod('toBeTruthy', function () {
      this.assert(!!utils.flag(this, 'object'), 'expected #{this} to be truthy', 'expected #{this} not to be truthy')
    })

    Assertion.addMethod('toBeGreaterThan', function (expected) {
      this.assert(utils.flag(this, 'object') > expected, 'expected #{this} to be greater than #{exp}', 'expected #{this} not to be greater than #{exp}', expected, utils.flag(this, 'object'))
    })

    Assertion.addMethod('toContain', function (expected) {
      const actual = utils.flag(this, 'object')
      const contains = Array.isArray(actual) || typeof actual === 'string'
        ? actual.indexOf(expected) >= 0
        : chai.util.eql(actual, expected)
      this.assert(contains, 'expected #{this} to contain #{exp}', 'expected #{this} not to contain #{exp}', expected, actual)
    })

    Assertion.addMethod('toThrow', function (expected) {
      const actual = utils.flag(this, 'object')
      let exception

      try {
        actual()
      } catch (error) {
        exception = error
      }

      const message = exception && (exception.message || exception)
      let matches = exception !== undefined

      if (matches && expected !== undefined) {
        if (expected instanceof RegExp) {
          matches = expected.test(message)
        } else if (typeof expected === 'string') {
          matches = String(message).indexOf(expected) >= 0
        } else if (typeof expected === 'function') {
          matches = exception instanceof expected
        } else {
          matches = chai.util.eql(message, expected)
        }
      }

      this.assert(matches, 'expected #{this} to throw', 'expected #{this} not to throw', expected, message)
    })

    Assertion.addMethod('toThrowContaining', function (expected) {
      const actual = utils.flag(this, 'object')
      let exception

      try {
        actual()
      } catch (error) {
        exception = error
      }

      const message = exception && (exception.message || exception)
      const contains = exception ? String(message).indexOf(expected) >= 0 : false
      this.assert(contains, 'expected #{this} to throw containing #{exp} but got #{act}', 'expected #{this} not to throw containing #{exp}', expected, message)
    })

    Assertion.addMethod('toContainHtml', function (expectedHtml, postProcessCleanedHtml) {
      const actual = utils.flag(this, 'object')
      let html = cleanedHtml(actual)
      expectedHtml = expectedHtml.replace(/(<!--.*?-->)\s*/g, '$1')
      if (postProcessCleanedHtml) {
        html = postProcessCleanedHtml(html)
      }
      this.assert(html === expectedHtml, 'expected #{act} to equal #{exp}', 'expected #{act} not to equal #{exp}', expectedHtml, html)
    })

    Assertion.addMethod('toContainText', function (expectedText, ignoreSpaces) {
      let actualText = (nodeText(utils.flag(this, 'object')) || '').replace(/\r\n/g, '\n')
      let normalizedExpectedText = expectedText
      if (ignoreSpaces) {
        actualText = actualText.replace(/\s/g, '')
        normalizedExpectedText = expectedText.replace(/\s/g, '')
      }
      this.assert(actualText === normalizedExpectedText, 'expected #{act} to equal #{exp}', 'expected #{act} not to equal #{exp}', normalizedExpectedText, actualText)
    })

    Assertion.addMethod('toHaveOwnProperties', function (expectedProperties) {
      const actual = utils.flag(this, 'object')
      const ownProperties = []
      for (const prop in actual) {
        if (Object.prototype.hasOwnProperty.call(actual, prop)) {
          ownProperties.push(prop)
        }
      }
      this.assert(chai.util.eql(ownProperties, expectedProperties), 'expected #{act} to deeply equal #{exp}', 'expected #{act} not to deeply equal #{exp}', expectedProperties, ownProperties, true)
    })

    Assertion.addMethod('toHaveTexts', function (expectedTexts) {
      const texts = ko.utils.arrayMap(utils.flag(this, 'object').childNodes, nodeText)
      this.assert(chai.util.eql(texts, expectedTexts), 'expected #{act} to deeply equal #{exp}', 'expected #{act} not to deeply equal #{exp}', expectedTexts, texts, true)
    })

    Assertion.addMethod('toHaveValues', function (expectedValues) {
      const values = ko.utils.arrayFilter(ko.utils.arrayMap(utils.flag(this, 'object').childNodes, function (node) { return node.value }), function (value) { return value !== undefined })
      this.assert(chai.util.eql(values, expectedValues), 'expected #{act} to deeply equal #{exp}', 'expected #{act} not to deeply equal #{exp}', expectedValues, values, true)
    })

    Assertion.addMethod('toHaveCheckedStates', function (expectedValues) {
      const values = ko.utils.arrayMap(utils.flag(this, 'object').childNodes, function (node) { return node.checked })
      this.assert(chai.util.eql(values, expectedValues), 'expected #{act} to deeply equal #{exp}', 'expected #{act} not to deeply equal #{exp}', expectedValues, values, true)
    })

    Assertion.addMethod('toHaveSelectedValues', function (expectedValues) {
      const selectedNodes = ko.utils.arrayFilter(utils.flag(this, 'object').childNodes, function (node) { return node.selected })
      const selectedValues = ko.utils.arrayMap(selectedNodes, function (node) { return ko.selectExtensions.readValue(node) })
      this.assert(chai.util.eql(selectedValues, expectedValues), 'expected #{act} to deeply equal #{exp}', 'expected #{act} not to deeply equal #{exp}', expectedValues, selectedValues, true)
    })

    Assertion.addMethod('toHaveBeenCalled', function () {
      const actual = utils.flag(this, 'object')
      this.assert(actual && typeof actual.callCount === 'number' && actual.callCount > 0, 'expected spy to have been called', 'expected spy not to have been called')
    })

    Assertion.addMethod('toHaveBeenCalledWith', function () {
      const actual = utils.flag(this, 'object')
      const expectedArgs = Array.prototype.slice.call(arguments)
      this.assert(actual && actual.calledWith && actual.calledWith.apply(actual, expectedArgs), 'expected spy to have been called with #{exp}', 'expected spy not to have been called with #{exp}', expectedArgs)
    })
  })

  global.prepareTestNode = prepareTestNode
  global.restoreAfter = restoreAfter
  global.setNodeText = setNodeText
  global.nodeText = nodeText
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
      expect(disableJQueryUsage).toEqual(ko.options.disableJQueryUsage)
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
