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

// IE 9 cannot reliably read the "nodeValue" property of a comment node (see https://github.com/SteveSanderson/knockout/issues/186)
// but it does give them a nonstandard alternative property called "text" that it can read reliably. Other browsers don't have that property.
// So, use node.text where available, and node.nodeValue elsewhere
import { emptyDomNode, setDomNodeChildren as setRegularDomNodeChildren } from './manipulation';
import { removeNode } from './disposal';
import { tagNameLower, isDomElement } from './info';
import * as domData from './data';
import options from '../options';

// @ts-ignore
import _let from '../../../tko.binding.core/src/let';

const commentNodesHaveTextProperty = options.document && options.document.createComment('test').data === '<!--test-->';

export const startCommentRegex = commentNodesHaveTextProperty ? /^<!--\s*ko(?:\s+([\s\S]+))?\s*-->$/ : /^\s*ko(?:\s+([\s\S]+))?\s*$/;
export const endCommentRegex = commentNodesHaveTextProperty ? /^<!--\s*\/ko\s*-->$/ : /^\s*\/ko\s*$/;
const htmlTagsWithOptionallyClosingChildren: {[tagName: string]: boolean|undefined} = { ul: true, ol: true };

export function isStartComment(node: Node) {
  return (node.nodeType === 8) && startCommentRegex.test(commentNodesHaveTextProperty ? (node as any).text : node.nodeValue);
}

export function isEndComment(node: Node) {
  return (node.nodeType === 8) && endCommentRegex.test(commentNodesHaveTextProperty ? (node as any).text : node.nodeValue);
}

function isUnmatchedEndComment(node: Node) {
  return isEndComment(node) && !domData.get(node, matchedEndCommentDataKey);
}

const matchedEndCommentDataKey = '__ko_matchedEndComment__';

export function getVirtualChildren(startComment: Node, allowUnbalanced?: boolean) {
  let currentNode: Node|null = startComment;
  let depth = 1;
  const children = [];

  while (currentNode = currentNode.nextSibling) {
    if (isEndComment(currentNode)) {
      domData.set(currentNode, matchedEndCommentDataKey, true);
      depth--;
      if (depth === 0) { return children; }
    }

    children.push(currentNode);

    if (isStartComment(currentNode)) { depth++; }
  }
  if (!allowUnbalanced) { throw new Error('Cannot find closing comment tag to match: ' + startComment.nodeValue); }
  return null;
}

function getMatchingEndComment(startComment: Node, allowUnbalanced?: boolean) {
  const allVirtualChildren = getVirtualChildren(startComment, allowUnbalanced);
  if (allVirtualChildren) {
    if (allVirtualChildren.length > 0) { return allVirtualChildren[allVirtualChildren.length - 1].nextSibling; }
    return startComment.nextSibling;
  } else { return null; } // Must have no matching end comment, and allowUnbalanced is true
}

function getUnbalancedChildTags(node: Node) {
    // e.g., from <div>OK</div><!-- ko blah --><span>Another</span>, returns: <!-- ko blah --><span>Another</span>
    //       from <div>OK</div><!-- /ko --><!-- /ko -->,             returns: <!-- /ko --><!-- /ko -->
  let childNode = node.firstChild as Node, captureRemaining = null;
  if (childNode) {
    do {
      if (captureRemaining) {
        // We already hit an unbalanced node and are now just scooping up all subsequent nodes
        captureRemaining.push(childNode);
      } else if (isStartComment(childNode)) {
        const matchingEndComment = getMatchingEndComment(childNode, /* allowUnbalanced: */ true);
        if (matchingEndComment) {
          // It's a balanced tag, so skip immediately to the end of this virtual set
          childNode = matchingEndComment;
        } else {
          // It's unbalanced, so start capturing from this point
          captureRemaining = [childNode];
        }
      } else if (isEndComment(childNode)) {
        captureRemaining = [childNode];     // It's unbalanced (if it wasn't, we'd have skipped over it already), so start capturing
      }
    } while (childNode = childNode.nextSibling as Node);
  }

  return captureRemaining;
}

export const allowedBindings = {};
export const hasBindingValue = isStartComment;

export function childNodes(node: Node) {
  return isStartComment(node) ? getVirtualChildren(node) : node.childNodes;
}

export function emptyNode(node: Node) {
  if (!isStartComment(node)) { emptyDomNode(node); } else {
    const virtualChildren = childNodes(node);
    if (virtualChildren) {
      for (let i = 0, j = virtualChildren.length; i < j; i++) { removeNode(virtualChildren[i]); }
    }
  }
}

export function setDomNodeChildren (node: Node, childNodes: ArrayLike<Node>) {
  if (!isStartComment(node)) { setRegularDomNodeChildren(node, childNodes) } else {
    emptyNode(node)
    const endCommentNode = node.nextSibling as Comment // Must be the next sibling, as we just emptied the children
    const parentNode = endCommentNode.parentNode as Node | Document
    for (var i = 0, j = childNodes.length; i < j; ++i) {
      parentNode.insertBefore(childNodes[i], endCommentNode)
    }
  }
}

export function prepend(containerNode: Node, nodeToPrepend: Node) {
  if (!isStartComment(containerNode)) {
    if (containerNode.firstChild) { containerNode.insertBefore(nodeToPrepend, containerNode.firstChild); } else { containerNode.appendChild(nodeToPrepend); }
  } else {
        // Start comments must always have a parent and at least one following sibling (the end comment)
    if (containerNode.parentNode) {
      containerNode.parentNode.insertBefore(nodeToPrepend, containerNode.nextSibling);
    }
  }
}

export function insertAfter(containerNode: Node, nodeToInsert: Node, insertAfterNode?: Node) {
  if (!insertAfterNode) {
    prepend(containerNode, nodeToInsert);
  } else if (!isStartComment(containerNode)) {
        // Insert after insertion point
    if (insertAfterNode.nextSibling) { containerNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling); } else { containerNode.appendChild(nodeToInsert); }
  } else {
        // Children of start comments must always have a parent and at least one following sibling (the end comment)
    if (containerNode.parentNode) {
      containerNode.parentNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling);
    }
  }
}

export function firstChild(node: Node) {
  if (!isStartComment(node)) {
    if (node.firstChild && isEndComment(node.firstChild)) {
      throw new Error('Found invalid end comment, as the first child of ' + (isDomElement(node) ? node.outerHTML : node));
    }
    return node.firstChild;
  }
  if (!node.nextSibling || isEndComment(node.nextSibling)) {
    return null;
  }
  return node.nextSibling;
}

export function lastChild(node: Node) {
  let nextChild = firstChild(node);
  let lastChildNode;

  do {
    lastChildNode = nextChild;
  } while (nextChild = nextSibling(nextChild));

  return lastChildNode;
}

export function nextSibling(node: Node|null) {
  if (!node) {
    return null;
  }

  if (isStartComment(node)) {
    node = getMatchingEndComment(node);
  }

  if (!node) {
    return null;
  }

  if (node.nextSibling && isEndComment(node.nextSibling)) {
    if (isUnmatchedEndComment(node.nextSibling)) {
      throw Error('Found end comment without a matching opening comment, as next sibling of ' + (isDomElement(node) ? node.outerHTML : node));
    }
    return null;
  } else {
    return node.nextSibling;
  }
}

export function previousSibling(node: Node|null) {
  if (!node) {
    return null;
  }

  let depth = 0;
  do {
    if (node.nodeType === 8) {
      if (isStartComment(node)) {
        if (--depth === 0) {
          return node;
        }
      } else if (isEndComment(node)) {
        depth++;
      }
    } else {
      if (depth === 0) { return node; }
    }
  } while (node = node.previousSibling);
}

export function virtualNodeBindingValue(node: Node) {
  const regexMatch = (commentNodesHaveTextProperty ? (node as any).text : node.nodeValue).match(startCommentRegex);
  return regexMatch ? regexMatch[1] : null;
}

export function normaliseVirtualElementDomStructure(elementVerified: Element) {
    // Workaround for https://github.com/SteveSanderson/knockout/issues/155
    // (IE <= 8 or IE 9 quirks mode parses your HTML weirdly, treating closing </li> tags as if they don't exist, thereby moving comment nodes
    // that are direct descendants of <ul> into the preceding <li>)
  if (!htmlTagsWithOptionallyClosingChildren[tagNameLower(elementVerified)]) { return; }

    // Scan immediate children to see if they contain unbalanced comment tags. If they do, those comment tags
    // must be intended to appear *after* that child, so move them there.
  let childNode = elementVerified.firstChild as Node
  if (childNode) {
    do {
      if (childNode.nodeType === 1) {
        const unbalancedTags = getUnbalancedChildTags(childNode);
        if (unbalancedTags) {
                    // Fix up the DOM by moving the unbalanced tags to where they most likely were intended to be placed - *after* the child
          const nodeToInsertBefore = childNode.nextSibling;
          for (const unbalancedTag of unbalancedTags) {
            if (nodeToInsertBefore) { elementVerified.insertBefore(unbalancedTag, nodeToInsertBefore); } else { elementVerified.appendChild(unbalancedTag); }
          }
        }
      }
    } while (childNode = childNode.nextSibling as Node);
  }
}
