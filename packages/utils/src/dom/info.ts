//
// Information about the DOM
//
import { arrayFirst } from '../array'

export function domNodeIsContainedBy(node: Node, containedByNode: Node) {
  if (node === containedByNode) {
    return true
  }
  if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    return false
  }
  // If there is no contained node, then the node is not attached to it
  // This case also happens when the shadow DOM from a HTMLTemplateElement is envolved
  if (!containedByNode) {
    return false
  }
  // Fixes issue #1162 - can't use node.contains for document fragments on IE8
  if (containedByNode.contains) {
    return containedByNode.contains(node.nodeType !== Node.ELEMENT_NODE ? node.parentNode : node)
  }
  if (containedByNode.compareDocumentPosition) {
    return containedByNode.compareDocumentPosition(node) === Node.DOCUMENT_POSITION_CONTAINED_BY
  }

  let parentNode: Node | null = node
  while (parentNode && parentNode != containedByNode) {
    parentNode = parentNode.parentNode
  }
  return !!parentNode
}

export function domNodeIsAttachedToDocument(node) {
  return domNodeIsContainedBy(node, node.ownerDocument.documentElement)
}

export function anyDomNodeIsAttachedToDocument(nodes) {
  return !!arrayFirst(nodes, domNodeIsAttachedToDocument)
}

export function tagNameLower(element: Element) {
  // For HTML elements, tagName will always be upper case; for XHTML elements, it'll be lower case.
  // Possible future optimization: If we know it's an element from an XHTML document (not HTML),
  // we don't need to do the .toLowerCase() as it will always be lower case anyway.
  return element && element.tagName && element.tagName.toLowerCase()
}

export function isTemplateTag(node): node is HTMLTemplateElement {
  return node && node.nodeType === Node.ELEMENT_NODE && tagNameLower(node) === 'template'
}

export function isDomElement(obj): obj is HTMLElement {
  if (window.HTMLElement) {
    return obj instanceof HTMLElement
  } else {
    return obj && obj.tagName && obj.nodeType === Node.ELEMENT_NODE
  }
}

export function isDocumentFragment(obj): obj is DocumentFragment {
  if (window.DocumentFragment) {
    return obj instanceof DocumentFragment
  } else {
    return obj && obj.nodeType === Node.DOCUMENT_FRAGMENT_NODE
  }
}
