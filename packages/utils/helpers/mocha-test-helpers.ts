import { assert } from 'chai'
import { options } from '../dist'

export function restoreAfter<T extends object, K extends keyof T>(
  cleanups: Array<() => void>,
  object: T,
  propertyName: K
) {
  const originalValue = object[propertyName]
  cleanups.push(() => {
    object[propertyName] = originalValue
  })
}

export function prepareTestNode(): HTMLElement {
  const existingNode = document.getElementById('testNode')
  if (existingNode !== null && existingNode.parentNode) {
    existingNode.parentNode.removeChild(existingNode)
  }

  const testNode = document.createElement('div')
  testNode.id = 'testNode'
  document.body.appendChild(testNode)
  return testNode
}

export function setNodeText(node: Node, text: string) {
  if ('textContent' in node) {
    node.textContent = text
  } else {
    ;(node as HTMLElement).innerText = text
  }
}

export function nodeText(node: Node) {
  return node.nodeType === Node.TEXT_NODE ? node.nodeValue : 'textContent' in node ? node.textContent : (node as HTMLElement).innerText
}

type HtmlNode = Node & { innerHTML: string }

function assertHtmlNode(node: Node | null): asserts node is HtmlNode {
  if (node === null) {
    throw new Error('expected node to exist')
  }
  assert('innerHTML' in node, 'expected node to support innerHTML')
}

function cleanedHtml(node: Node | null) {
  assertHtmlNode(node)
  let html = node.innerHTML.toLowerCase().replace(/\r\n/g, '')
  html = html.replace(/(<!--.*?-->)\s*/g, '$1')
  html = html.replace(/ __ko__\d+=\"(ko\d+|null)\"/g, '')
  return html
}

export function expectNodeTypes(nodes: ArrayLike<Node>, expectedTypes: number[]) {
  assert.deepEqual(
    Array.from(nodes, node => node.nodeType),
    expectedTypes
  )
}

export function expectContainText(node: Node, expectedText: string, ignoreSpaces = false) {
  let actualText = nodeText(node) || ''
  actualText = actualText.replace(/\r\n/g, '\n')
  if (ignoreSpaces) {
    actualText = actualText.replace(/\s/g, '')
    expectedText = expectedText.replace(/\s/g, '')
  }
  assert.equal(actualText, expectedText)
}

export function expectContainHtml(node: Node | null, expectedHtml: string, postProcessCleanedHtml?: (html: string) => string) {
  let html = cleanedHtml(node)
  expectedHtml = expectedHtml.replace(/(<!--.*?-->)\s*/g, '$1')
  if (postProcessCleanedHtml) {
    html = postProcessCleanedHtml(html)
  }
  assert.equal(html, expectedHtml)
}

export function expectContainHtmlElementsAndText(node: Node | null, expectedHtml: string) {
  assert.equal(cleanedHtml(node).replace(/<!--.+?-->/g, ''), expectedHtml)
}

export function useMockForTasks(cleanups: Array<() => void>) {
  restoreAfter(cleanups, options, 'taskScheduler')
  options.taskScheduler = callback => setTimeout(callback, 0)
}
