import { assert } from 'chai'

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

function cleanedHtml(node: Element) {
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

export function expectContainHtml(node: Element, expectedHtml: string, postProcessCleanedHtml?: (html: string) => string) {
  let html = cleanedHtml(node)
  expectedHtml = expectedHtml.replace(/(<!--.*?-->)\s*/g, '$1')
  if (postProcessCleanedHtml) {
    html = postProcessCleanedHtml(html)
  }
  assert.equal(html, expectedHtml)
}

export function expectContainHtmlElementsAndText(node: Element, expectedHtml: string) {
  assert.equal(cleanedHtml(node).replace(/<!--.+?-->/g, ''), expectedHtml)
}
