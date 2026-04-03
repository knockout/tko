/* eslint no-cond-assign: 0 */
//
// Virtual Elements
//
//
// "Virtual elements" is an abstraction on top of the usual DOM API which understands the notion that comment nodes
// may be used to represent hierarchy (in addition to the DOM's natural hierarchy).
// If you call the DOM-manipulating functions on ko.virtualElements, you will be able to read and write the state
// of that virtual hierarchy
//
// The point of all this is to support containerless templates (e.g., <!-- ko foreach:someCollection -->blah<!-- /ko -->)
// without having to scatter special cases all over the binding and templating code.

import { emptyDomNode, setDomNodeChildren as setRegularDomNodeChildren } from './manipulation'
import { removeNode } from './disposal'
import { tagNameLower, isTemplateTag } from './info'
import * as domData from './data'
import options from '../options'

export const startCommentRegex = /^\s*ko(?:\s+([\s\S]+))?\s*$/
export const endCommentRegex = /^\s*\/ko\s*$/
const htmlTagsWithOptionallyClosingChildren = { ul: true, ol: true }

export function isStartComment(node) {
  return node.nodeType === Node.COMMENT_NODE && startCommentRegex.test(node.nodeValue)
}

export function isEndComment(node) {
  return node.nodeType === Node.COMMENT_NODE && endCommentRegex.test(node.nodeValue)
}

function isUnmatchedEndComment(node) {
  return isEndComment(node) && !domData.get(node, matchedEndCommentDataKey)
}

const matchedEndCommentDataKey = '__ko_matchedEndComment__'

export function getVirtualChildren(startComment, allowUnbalanced?) {
  let currentNode = startComment
  let depth = 1
  const children = new Array()
  while ((currentNode = currentNode.nextSibling)) {
    if (isEndComment(currentNode)) {
      domData.set(currentNode, matchedEndCommentDataKey, true)
      depth--
      if (depth === 0) {
        return children
      }
    }

    children.push(currentNode)

    if (isStartComment(currentNode)) {
      depth++
    }
  }
  if (!allowUnbalanced) {
    throw new Error('Cannot find closing comment tag to match: ' + startComment.nodeValue)
  }
  return null
}

function getMatchingEndComment(startComment, allowUnbalanced?) {
  const allVirtualChildren = getVirtualChildren(startComment, allowUnbalanced)
  if (allVirtualChildren) {
    if (allVirtualChildren.length > 0) {
      return allVirtualChildren[allVirtualChildren.length - 1].nextSibling
    }
    return startComment.nextSibling
  } else {
    return null
  } // Must have no matching end comment, and allowUnbalanced is true
}

function getUnbalancedChildTags(node) {
  // e.g., from <div>OK</div><!-- ko blah --><span>Another</span>, returns: <!-- ko blah --><span>Another</span>
  //       from <div>OK</div><!-- /ko --><!-- /ko -->,             returns: <!-- /ko --><!-- /ko -->
  let childNode = node.firstChild,
    captureRemaining: any = null
  if (childNode) {
    do {
      if (captureRemaining) // We already hit an unbalanced node and are now just scooping up all subsequent nodes
      {
        captureRemaining.push(childNode)
      } else if (isStartComment(childNode)) {
        const matchingEndComment = getMatchingEndComment(childNode, /* allowUnbalanced: */ true)
        if (matchingEndComment) // It's a balanced tag, so skip immediately to the end of this virtual set
        {
          childNode = matchingEndComment
        } else {
          captureRemaining = [childNode]
        } // It's unbalanced, so start capturing from this point
      } else if (isEndComment(childNode)) {
        captureRemaining = [childNode] // It's unbalanced (if it wasn't, we'd have skipped over it already), so start capturing
      }
    } while ((childNode = childNode.nextSibling))
  }
  return captureRemaining
}

export interface VirtualElementsAllowedBindings {
  text: boolean
  foreach: boolean
  if: boolean
  ifnot: boolean
  with: boolean
  let: boolean
  using: boolean
  template: boolean
  component: boolean
}

export const allowedBindings: VirtualElementsAllowedBindings = Object.create(null)
export const hasBindingValue = isStartComment

export function childNodes(node: Node): any {
  return isStartComment(node) ? getVirtualChildren(node) : node.childNodes
}

export function emptyNode(node: Node) {
  if (!isStartComment(node)) {
    emptyDomNode(node)
  } else {
    const virtualChildren = childNodes(node)
    for (let i = 0, j = virtualChildren.length; i < j; i++) {
      removeNode(virtualChildren[i])
    }
  }
}

export function setDomNodeChildren(node: Node, childNodes: Node[]) {
  if (!isStartComment(node)) {
    setRegularDomNodeChildren(node, childNodes)
  } else {
    emptyNode(node)
    const endCommentNode = node.nextSibling // Must be the next sibling, as we just emptied the children
    if (endCommentNode && endCommentNode.parentNode) {
      const parentNode = endCommentNode.parentNode
      for (let i = 0, j = childNodes.length; i < j; ++i) {
        parentNode.insertBefore(childNodes[i], endCommentNode)
      }
    }
  }
}

export function prepend(containerNode: Node, nodeToPrepend: Node) {
  if (!isStartComment(containerNode)) {
    if (containerNode.firstChild) {
      containerNode.insertBefore(nodeToPrepend, containerNode.firstChild)
    } else {
      containerNode.appendChild(nodeToPrepend)
    }
  } else {
    // Start comments must always have a parent and at least one following sibling (the end comment)
    containerNode.parentNode?.insertBefore(nodeToPrepend, containerNode.nextSibling)
  }
}

export function insertAfter(containerNode: Node, nodeToInsert: Node, insertAfterNode: Node) {
  if (!insertAfterNode) {
    prepend(containerNode, nodeToInsert)
  } else if (!isStartComment(containerNode)) {
    // Insert after insertion point
    if (insertAfterNode.nextSibling) {
      containerNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling)
    } else {
      containerNode.appendChild(nodeToInsert)
    }
  } else {
    // Children of start comments must always have a parent and at least one following sibling (the end comment)
    containerNode.parentNode?.insertBefore(nodeToInsert, insertAfterNode.nextSibling)
  }
}

export function firstChild(node: Node) {
  if (isTemplateTag(node)) {
    return node.content.firstChild
  }

  if (!isStartComment(node)) {
    if (node.firstChild && isEndComment(node.firstChild)) {
      throw new Error('Found invalid end comment, as the first child of ' + (node as Element).outerHTML)
    }
    return node.firstChild
  }
  if (!node.nextSibling || isEndComment(node.nextSibling)) {
    return null
  }
  return node.nextSibling
}

export function lastChild(node: Node) {
  let nextChild = firstChild(node)
  if (!nextChild) return null

  let lastChildNode

  do {
    lastChildNode = nextChild
  } while ((nextChild = nextSibling(nextChild)))

  return lastChildNode
}

export function nextSibling(node: Node) {
  if (isStartComment(node)) {
    node = getMatchingEndComment(node)
  }

  if (node.nextSibling && isEndComment(node.nextSibling)) {
    if (isUnmatchedEndComment(node.nextSibling)) {
      throw Error(
        'Found end comment without a matching opening comment, as next sibling of ' + (node as Element).outerHTML
      )
    }
    return null
  } else {
    return node.nextSibling
  }
}

export function previousSibling(node) {
  let depth = 0
  do {
    if (node.nodeType === Node.COMMENT_NODE) {
      if (isStartComment(node)) {
        if (--depth === 0) {
          return node
        }
      } else if (isEndComment(node)) {
        depth++
      }
    } else {
      if (depth === 0) {
        return node
      }
    }
  } while ((node = node.previousSibling))
}

export function virtualNodeBindingValue(node): string | null {
  const regexMatch = node.nodeValue.match(startCommentRegex) as RegExpMatchArray
  return regexMatch ? regexMatch[1] : null
}

export function normaliseVirtualElementDomStructure(elementVerified) {
  // Workaround for https://github.com/SteveSanderson/knockout/issues/155
  // (IE <= 8 or IE 9 quirks mode parses your HTML weirdly, treating closing </li> tags as if they don't exist, thereby moving comment nodes
  // that are direct descendants of <ul> into the preceding <li>)
  if (!htmlTagsWithOptionallyClosingChildren[tagNameLower(elementVerified)]) {
    return
  }

  // Scan immediate children to see if they contain unbalanced comment tags. If they do, those comment tags
  // must be intended to appear *after* that child, so move them there.
  let childNode = elementVerified.firstChild
  if (childNode) {
    do {
      if (childNode.nodeType === Node.ELEMENT_NODE) {
        const unbalancedTags = getUnbalancedChildTags(childNode)
        if (unbalancedTags) {
          // Fix up the DOM by moving the unbalanced tags to where they most likely were intended to be placed - *after* the child
          const nodeToInsertBefore = childNode.nextSibling
          for (let i = 0; i < unbalancedTags.length; i++) {
            if (nodeToInsertBefore) {
              elementVerified.insertBefore(unbalancedTags[i], nodeToInsertBefore)
            } else {
              elementVerified.appendChild(unbalancedTags[i])
            }
          }
        }
      }
    } while ((childNode = childNode.nextSibling))
  }
}
