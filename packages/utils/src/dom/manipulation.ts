//
// DOM manipulation
//
/* eslint no-empty: 0 */
import { makeArray } from '../array'
import { ieVersion } from '../ie'
import { cleanNode, removeNode } from './disposal'

export function moveCleanedNodesToContainerElement (nodes) {
    // Ensure it's a real array, as we're about to reparent the nodes and
    // we don't want the underlying collection to change while we're doing that.
  var nodesArray = makeArray(nodes)
  var templateDocument = (nodesArray[0] && nodesArray[0].ownerDocument) || document

  var container = templateDocument.createElement('div')
  for (var i = 0, j = nodesArray.length; i < j; i++) {
    container.appendChild(cleanNode(nodesArray[i]))
  }
  return container
}

export function cloneNodes (nodesArray, shouldCleanNodes) {
  for (var i = 0, j = nodesArray.length, newNodesArray = []; i < j; i++) {
    var clonedNode = nodesArray[i].cloneNode(true)
    newNodesArray.push(shouldCleanNodes ? cleanNode(clonedNode) : clonedNode)
  }
  return newNodesArray
}

export function setDomNodeChildren (domNode, childNodes) {
  emptyDomNode(domNode)
  if (childNodes) {
    for (var i = 0, j = childNodes.length; i < j; i++) { domNode.appendChild(childNodes[i]) }
  }
}

export function replaceDomNodes (nodeToReplaceOrNodeArray, newNodesArray) {
  var nodesToReplaceArray = nodeToReplaceOrNodeArray.nodeType ? [nodeToReplaceOrNodeArray] : nodeToReplaceOrNodeArray
  if (nodesToReplaceArray.length > 0) {
    var insertionPoint = nodesToReplaceArray[0]
    var parent = insertionPoint.parentNode
    for (var i = 0, j = newNodesArray.length; i < j; i++) { parent.insertBefore(newNodesArray[i], insertionPoint) }
    for (i = 0, j = nodesToReplaceArray.length; i < j; i++) {
      removeNode(nodesToReplaceArray[i])
    }
  }
}

export function setElementName (element, name) {
  element.name = name

    // Workaround IE 6/7 issue
    // - https://github.com/SteveSanderson/knockout/issues/197
    // - http://www.matts411.com/post/setting_the_name_attribute_in_ie_dom/
  if (ieVersion <= 7) {
    try {
      const safeInput = document.createElement('input');
      safeInput.name = element.name;
      element.mergeAttributes(safeInput, false);
    } catch (e) {} // For IE9 with doc mode "IE9 Standards" and browser mode "IE9 Compatibility View"
  }
}

export function emptyDomNode (domNode) {
  while (domNode.firstChild) {
    removeNode(domNode.firstChild)
  }
}
