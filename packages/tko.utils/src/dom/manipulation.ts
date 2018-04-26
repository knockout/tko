//
// DOM manipulation
//
/* eslint no-empty: 0 */
const {isArray} = Array;

import { makeArray } from '../array';
import { ieVersion } from '../ie';
import { cleanNode, removeNode } from './disposal';
import { forceRefresh } from './fixes';
import * as virtualElements from './virtualElements';

export function moveCleanedNodesToContainerElement(nodes: ArrayLike<Node>) {
    // Ensure it's a real array, as we're about to reparent the nodes and
    // we don't want the underlying collection to change while we're doing that.
  const nodesArray = makeArray(nodes);
  const templateDocument = (nodesArray[0] && nodesArray[0].ownerDocument) || document;

  const container = templateDocument.createElement('div');
  for (let i = 0, j = nodesArray.length; i < j; i++) {
    container.appendChild(cleanNode(nodesArray[i]));
  }
  return container;
}

export function cloneNodes(nodesArray: ArrayLike<Node>, shouldCleanNodes?: boolean) {
  const newNodesArray = [];

  for (let i = 0, j = nodesArray.length; i < j; i++) {
    const clonedNode = nodesArray[i].cloneNode(true);
    newNodesArray.push(shouldCleanNodes ? cleanNode(clonedNode) : clonedNode);
  }

  return newNodesArray;
}

export function setDomNodeChildren(domNode: Node, childNodes: ArrayLike<Node>) {
  emptyDomNode(domNode);
  if (childNodes) {
    for (let i = 0, j = childNodes.length; i < j; i++) { domNode.appendChild(childNodes[i]); }
  }
}

export function replaceDomNodes(nodeToReplaceOrNodeArray: Node[]|Node, newNodesArray: Node[]) {
  const nodesToReplaceArray = !isArray(nodeToReplaceOrNodeArray) ? [nodeToReplaceOrNodeArray] : nodeToReplaceOrNodeArray;
  if (nodesToReplaceArray.length > 0) {
    const insertionPoint = nodesToReplaceArray[0];
    const parent = insertionPoint.parentNode;
    for (let i = 0, j = newNodesArray.length; i < j; i++) { parent!.insertBefore(newNodesArray[i], insertionPoint); }
    for (let i = 0, j = nodesToReplaceArray.length; i < j; i++) {
      removeNode(nodesToReplaceArray[i]);
    }
  }
}

export function setElementName(element: HTMLElement, name: string) {
  (element as any).name = name;

    // Workaround IE 6/7 issue
    // - https://github.com/SteveSanderson/knockout/issues/197
    // - http://www.matts411.com/post/setting_the_name_attribute_in_ie_dom/
  if (ieVersion && ieVersion <= 7) {
    try {
      (element as any).mergeAttributes(document.createElement("<input name='" + (element as any).name + "'/>"), false);
    } catch (e) {} // For IE9 with doc mode "IE9 Standards" and browser mode "IE9 Compatibility View"
  }
}

type StringFunction = () => string;
export function setTextContent(element: HTMLElement, textContent: string|StringFunction) {
  let value = typeof textContent === 'function' ? textContent() : textContent;
  if ((value === null) || (value === undefined)) { value = ''; }

    // We need there to be exactly one child: a text node.
    // If there are no children, more than one, or if it's not a text node,
    // we'll clear everything and create a single text node.
  const innerTextNode = virtualElements.firstChild(element);
  if (!innerTextNode || innerTextNode.nodeType !== 3 || virtualElements.nextSibling(innerTextNode)) {
    virtualElements.setDomNodeChildren(element, [element.ownerDocument.createTextNode(value)]);
  } else {
    (innerTextNode as any).data = value;
  }

  forceRefresh(element);
}

export function emptyDomNode(domNode: Node) {
  while (domNode.firstChild) {
    removeNode(domNode.firstChild);
  }
}
