//
// Memoization
//
import { arrayPushAll } from './array'

let memos = {}

function randomMax8HexChars() {
  return (((1 + Math.random()) * 0x100000000) | 0).toString(16).substring(1)
}

function generateRandomId() {
  return randomMax8HexChars() + randomMax8HexChars()
}

function findMemoNodes(rootNode: Node, appendToArray: any[]) {
  if (!rootNode) {
    return
  }
  if (rootNode.nodeType === Node.COMMENT_NODE) {
    const comment = rootNode as Comment
    let memoId = parseMemoText(comment.nodeValue)
    if (memoId != null) {
      appendToArray.push({ domNode: rootNode, memoId: memoId })
    }
  } else if (rootNode.nodeType === Node.ELEMENT_NODE) {
    for (let i = 0, childNodes = rootNode.childNodes, j = childNodes.length; i < j; i++) {
      findMemoNodes(childNodes[i], appendToArray)
    }
  }
}

export function memoize(callback: (val: any) => void): string {
  if (typeof callback !== 'function') {
    throw new Error('You can only pass a function to memoization.memoize()')
  }
  let memoId = generateRandomId()
  memos[memoId] = callback
  return '<!--[ko_memo:' + memoId + ']-->'
}

export function unmemoize(memoId: string, callbackParams: any[]) {
  let callback = memos[memoId]
  if (callback === undefined) {
    throw new Error("Couldn't find any memo with ID " + memoId + ". Perhaps it's already been unmemoized.")
  }
  try {
    callback.apply(null, callbackParams || [])
    return true
  } finally {
    delete memos[memoId]
  }
}

export function unmemoizeDomNodeAndDescendants(domNode: Node, extraCallbackParamsArray: any[]) {
  let memos = new Array()
  findMemoNodes(domNode, memos)
  for (let i = 0, j = memos.length; i < j; i++) {
    let node = memos[i].domNode
    let combinedParams = [node]
    if (extraCallbackParamsArray) {
      arrayPushAll(combinedParams, extraCallbackParamsArray)
    }
    unmemoize(memos[i].memoId, combinedParams)
    node.nodeValue = '' // Neuter this node so we don't try to unmemoize it again
    if (node.parentNode) {
      node.parentNode.removeChild(node)
    } // If possible, erase it totally (not always possible - someone else might just hold a reference to it then call unmemoizeDomNodeAndDescendants again)
  }
}

export function parseMemoText(memoText: string | null): string | null {
  if (!memoText) {
    return null
  }

  let match = memoText.match(/^\[ko_memo\:(.*?)\]$/)
  return match ? match[1] : null
}
