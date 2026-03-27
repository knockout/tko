import { expect } from 'bun:test'

function nodeText(node: any) {
  return node?.nodeType === Node.TEXT_NODE ? node.data : 'textContent' in node ? node.textContent : node?.innerText
}

function normalizeHtml(node: HTMLElement, postProcess?: (html: string) => string) {
  let html = node.innerHTML.toLowerCase().replace(/\r\n/g, '')
  html = html.replace(/(<!--.*?-->)\s*/g, '$1')
  html = html.replace(/ __ko__\d+=\"(ko\d+|null)\"/g, '')
  if (postProcess) html = postProcess(html)
  return html
}

const matchers = {
  toHaveNodeTypes(received: any[], expected: number[]) {
    const values = received.map(node => node.nodeType)
    return {
      pass: this.equals(values, expected),
      message: () => `expected ${JSON.stringify(values)} to equal ${JSON.stringify(expected)}`
    }
  },

  toContainHtmlElementsAndText(received: HTMLElement, expected: string) {
    const actual = normalizeHtml(received).replace(/<!--.+?-->/g, '')
    return {
      pass: actual === expected,
      message: () => `expected ${actual} to equal ${expected}`
    }
  },

  toContainText(received: any, expected: string, ignoreSpaces?: boolean) {
    const actualText = String(nodeText(received) ?? '').replace(/\r\n/g, '\n')
    const normalizedActual = ignoreSpaces ? actualText.replace(/\s/g, '') : actualText
    const normalizedExpected = ignoreSpaces ? expected.replace(/\s/g, '') : expected
    return {
      pass: normalizedActual === normalizedExpected,
      message: () => `expected ${JSON.stringify(normalizedActual)} to equal ${JSON.stringify(normalizedExpected)}`
    }
  },

  toHaveTexts(received: Element, expected: string[]) {
    const texts = Array.from(received.childNodes).map(node => nodeText(node))
    return {
      pass: this.equals(texts, expected),
      message: () => `expected ${JSON.stringify(texts)} to equal ${JSON.stringify(expected)}`
    }
  },

  toHaveValues(received: Element, expected: any[]) {
    const values = Array.from(received.childNodes)
      .map((node: any) => node.value)
      .filter(value => value !== undefined)
    return {
      pass: this.equals(values, expected),
      message: () => `expected ${JSON.stringify(values)} to equal ${JSON.stringify(expected)}`
    }
  },

  toHaveCheckedStates(received: Element, expected: boolean[]) {
    const values = Array.from(received.childNodes).map((node: any) => node.checked)
    return {
      pass: this.equals(values, expected),
      message: () => `expected ${JSON.stringify(values)} to equal ${JSON.stringify(expected)}`
    }
  },

  toHaveSelectedValues(received: Element, expected: any[]) {
    const values = Array.from(received.childNodes)
      .filter((node: any) => node.selected)
      .map((node: any) => node.value)
    return {
      pass: this.equals(values, expected),
      message: () => `expected ${JSON.stringify(values)} to equal ${JSON.stringify(expected)}`
    }
  },

  toEqualOneOf(received: any, expectedList: any[]) {
    const pass = expectedList.some(item => this.equals(received, item))
    return {
      pass,
      message: () => `expected ${JSON.stringify(received)} to equal one of ${JSON.stringify(expectedList)}`
    }
  },

  toThrowContaining(received: () => unknown, expected: string) {
    let thrown: any
    try {
      received()
    } catch (error) {
      thrown = error
    }
    const message = thrown && (thrown.message || String(thrown))
    return {
      pass: typeof message === 'string' && message.includes(expected),
      message: () =>
        message
          ? `expected thrown message ${JSON.stringify(message)} to contain ${JSON.stringify(expected)}`
          : `expected function to throw containing ${JSON.stringify(expected)}`
    }
  },

  toContainHtml(received: HTMLElement, expected: string, postProcess?: (html: string) => string) {
    const actual = normalizeHtml(received, postProcess)
    const normalizedExpected = expected.replace(/(<!--.*?-->)\s*/g, '$1')
    return {
      pass: actual === normalizedExpected,
      message: () => `expected ${actual} to equal ${normalizedExpected}`
    }
  }
}

const globalKey = Symbol.for('tko.bun-dom.matchers')
if (!(globalThis as any)[globalKey]) {
  expect.extend(matchers)
  ;(globalThis as any)[globalKey] = true
}

export function prepareTestNode() {
  const existingNode = document.getElementById('testNode')
  if (existingNode?.parentNode) existingNode.parentNode.removeChild(existingNode)
  const testNode = document.createElement('div')
  testNode.id = 'testNode'
  document.body.appendChild(testNode)
  return testNode
}
