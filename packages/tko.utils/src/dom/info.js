//
// Information about the DOM
//
import { arrayFirst } from '../array.js';

export function domNodeIsContainedBy (node, containedByNode) {
    if (node === containedByNode)
        return true;
    if (node.nodeType === 11)
        return false; // Fixes issue #1162 - can't use node.contains for document fragments on IE8
    if (containedByNode.contains)
        return containedByNode.contains(node.nodeType !== 1 ? node.parentNode : node);
    if (containedByNode.compareDocumentPosition)
        return (containedByNode.compareDocumentPosition(node) & 16) == 16;
    while (node && node != containedByNode) {
        node = node.parentNode;
    }
    return !!node;
}

export function domNodeIsAttachedToDocument (node) {
    return domNodeIsContainedBy(node, node.ownerDocument.documentElement);
}

export function anyDomNodeIsAttachedToDocument(nodes) {
    return !!arrayFirst(nodes, domNodeIsAttachedToDocument);
}

export function tagNameLower(element) {
    // For HTML elements, tagName will always be upper case; for XHTML elements, it'll be lower case.
    // Possible future optimization: If we know it's an element from an XHTML document (not HTML),
    // we don't need to do the .toLowerCase() as it will always be lower case anyway.
    return element && element.tagName && element.tagName.toLowerCase();
}

export function isDomElement(obj) {
    if (window.HTMLElement) {
        return obj instanceof HTMLElement;
    } else {
        return obj && obj.tagName && obj.nodeType === 1;
    }
}

export function isDocumentFragment(obj) {
    if (window.DocumentFragment) {
        return obj instanceof DocumentFragment;
    } else {
        return obj && obj.nodeType === 11;
    }
}
