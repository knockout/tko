//
// Information about the DOM
//
import { arrayFirst } from '../array';

export function domNodeIsContainedBy(node: Node, containedByNode: Node) {
  if (node === containedByNode) { return true; }
  if (node.nodeType === 11) { return false; } // Fixes issue #1162 - can't use node.contains for document fragments on IE8
  if (containedByNode.contains) {
    const childNode = node.nodeType !== 1 ? node.parentNode : node;
    return childNode && containedByNode.contains(childNode) || false;
  }

  if (containedByNode.compareDocumentPosition) {
    // tslint:disable-next-line:no-bitwise
    return (containedByNode.compareDocumentPosition(node) & 16) === 16;
  }

  let parentNode: Node|null = node;
  while (parentNode && parentNode !== containedByNode) {
    parentNode = parentNode.parentNode;
  }
  return !!parentNode;
}

export function domNodeIsAttachedToDocument(node: Node) {
  return domNodeIsContainedBy(node, (node.ownerDocument as HTMLDocument).documentElement);
}

export function anyDomNodeIsAttachedToDocument(nodes: Node[]) {
  return !!arrayFirst(nodes, domNodeIsAttachedToDocument);
}

export function tagNameLower(element: Element) {
    // For HTML elements, tagName will always be upper case; for XHTML elements, it'll be lower case.
    // Possible future optimization: If we know it's an element from an XHTML document (not HTML),
    // we don't need to do the .toLowerCase() as it will always be lower case anyway.
  return element && element.tagName && element.tagName.toLowerCase();
}

export function isDomElement(obj: any): obj is HTMLElement {
  if ((window as any).HTMLElement) {
    return obj instanceof HTMLElement;
  } else {
    return obj && obj.tagName && obj.nodeType === 1;
  }
}

export function isDocumentFragment(obj: any): obj is DocumentFragment {
  if ((window as any).DocumentFragment) {
    return obj instanceof DocumentFragment;
  } else {
    return obj && obj.nodeType === 11;
  }
}
