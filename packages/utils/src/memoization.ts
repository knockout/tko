//
// Memoization
//
import { arrayPushAll } from './array'

var memos = {}

function randomMax8HexChars () {
  return (((1 + Math.random()) * 0x100000000) | 0).toString(16).substring(1)
}

function generateRandomId () {
  return randomMax8HexChars() + randomMax8HexChars()
}

function findMemoNodes (rootNode : Node, appendToArray : any[]) {
  if (!rootNode) { return }
  if (rootNode.nodeType == 8) {
    const comment = rootNode as Comment
    var memoId = parseMemoText(comment.nodeValue)
    if (memoId != null) { appendToArray.push({ domNode: rootNode, memoId: memoId }) }
  } else if (rootNode.nodeType == 1) {
    for (var i = 0, childNodes = rootNode.childNodes, j = childNodes.length; i < j; i++) { findMemoNodes(childNodes[i], appendToArray) }
  }
}

export function memoize (callback : (val: any) => void) : string {
  if (typeof callback !== 'function') { throw new Error('You can only pass a function to memoization.memoize()') }
  var memoId = generateRandomId()
  memos[memoId] = callback
  return '<!--[ko_memo:' + memoId + ']-->'
}

export function unmemoize (memoId : string, callbackParams: any[]) {
  var callback = memos[memoId]
  if (callback === undefined) { throw new Error("Couldn't find any memo with ID " + memoId + ". Perhaps it's already been unmemoized.") }
  try {
    callback.apply(null, callbackParams || [])
    return true
  } finally { delete memos[memoId] }
}

export function unmemoizeDomNodeAndDescendants (domNode : Node, extraCallbackParamsArray : any[]) {
  var memos = new Array()
  findMemoNodes(domNode, memos)
  for (var i = 0, j = memos.length; i < j; i++) {
    var node = memos[i].domNode
    var combinedParams = [node]
    if (extraCallbackParamsArray) { arrayPushAll(combinedParams, extraCallbackParamsArray) }
    unmemoize(memos[i].memoId, combinedParams)
    node.nodeValue = '' // Neuter this node so we don't try to unmemoize it again
    if (node.parentNode) { node.parentNode.removeChild(node) } // If possible, erase it totally (not always possible - someone else might just hold a reference to it then call unmemoizeDomNodeAndDescendants again)
  }
}

export function parseMemoText (memoText : string | null) : string | null {
  if(!memoText)
    return null
  var match = memoText.match(/^\[ko_memo\:(.*?)\]$/)
  return match ? match[1] : null
}
