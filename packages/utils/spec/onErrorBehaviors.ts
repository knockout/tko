import { expect } from 'chai'

import { options, tasks } from '../dist'

function waitFor(condition: () => boolean, timeoutMs = 100) {
  return new Promise<void>((resolve, reject) => {
    const deadline = Date.now() + timeoutMs

    function poll() {
      if (condition()) {
        resolve()
        return
      }

      if (Date.now() >= deadline) {
        reject(new Error('Timed out waiting for async error handling'))
        return
      }

      setTimeout(poll, 1)
    }

    poll()
  })
}

describe('onError handler', function () {
  let koOnErrorCount = 0
  let windowOnErrorCount = 0
  const windowOnErrorOriginal = window.onerror
  const optionsOnErrorOriginal = options.onError
  let lastSeenError = null

  beforeEach(function () {
    options.onError = function (error) {
      lastSeenError = error
      koOnErrorCount++
    }

    function ensureNodeExistsAndIsEmpty(id: string, tagName?: string, type?: string): HTMLElement {
      const existingNode = document.getElementById(id)
      if (existingNode != null) {
        existingNode.parentNode?.removeChild(existingNode)
      }
      const resultNode = document.createElement(tagName || 'div')
      resultNode.id = id
      if (type) {
        resultNode.setAttribute('type', type)
      }
      document.body.appendChild(resultNode)
      return resultNode
    }

    ;(window as any).testDivTemplate = ensureNodeExistsAndIsEmpty('testDivTemplate')
    ;(window as any).templateOutput = ensureNodeExistsAndIsEmpty('templateOutput')

    koOnErrorCount = 0
    windowOnErrorCount = 0

    window.onerror = function () {
      windowOnErrorCount++

      // Don't spam the console, since these were triggered deliberately
      // Annoyingly, Phantom interprets this return value backwardly, treating 'false'
      // to mean 'suppress', when browsers all use 'true' to mean 'suppress'.
      const isPhantom = !!(window as any)._phantom
      return !isPhantom
    }
  })

  afterEach(function () {
    expect(tasks.resetForTesting()).to.equal(0)
    window.onerror = windowOnErrorOriginal
    options.onError = optionsOnErrorOriginal
    lastSeenError = null
  })

  it('does not re-throw the error', async function () {
    let expectedInstance
    tasks.schedule(function () {
      expectedInstance = new Error('Some error')
      throw expectedInstance
    })

    await waitFor(function () {
      return koOnErrorCount > 0
    })

    expect(koOnErrorCount).to.equal(1)
    expect(windowOnErrorCount).to.equal(0)
    expect(lastSeenError).to.equal(expectedInstance)
  })
})
