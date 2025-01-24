//
// DOM manipulation
//
/* eslint no-empty: 0 */
import { makeArray } from '../array'
import { ieVersion } from '../ie'
import { cleanNode, removeNode } from './disposal'

export function moveCleanedNodesToContainerElement (nodes : ArrayLike<Node>) {
    // Ensure it's a real array, as we're about to reparent the nodes and
    // we don't want the underlying collection to change while we're doing that.
  const nodesArray = makeArray(nodes) as Node[] 
  const templateDocument = (nodesArray[0] && nodesArray[0].ownerDocument) || document

  const container = templateDocument.createElement('div')
  for (let i = 0, j = nodesArray.length; i < j; i++) {
    container.appendChild(cleanNode(nodesArray[i]))
  }
  return container
}

export function cloneNodes (nodesArray : ArrayLike<Node> , shouldCleanNodes?: boolean) {
  const newNodesArray = new Array();

  for (let i = 0; i < nodesArray.length; i++) {
    const clonedNode = nodesArray[i].cloneNode(true)
    newNodesArray.push(shouldCleanNodes ? cleanNode(clonedNode) : clonedNode)
  }

  return newNodesArray
}

export function setDomNodeChildren (domNode: Node, childNodes:ArrayLike<Node>) {
  emptyDomNode(domNode)
  if (childNodes) {
    for (let i = 0; i < childNodes.length; i++) {
       domNode.appendChild(childNodes[i]) 
    }
  }
}

export function replaceDomNodes (nodeToReplaceOrNodeArray: Node[] | Node, newNodesArray: Node[]) {
  let nodesToReplaceArray = Array.isArray(nodeToReplaceOrNodeArray) ? nodeToReplaceOrNodeArray:  [nodeToReplaceOrNodeArray]
  if (nodesToReplaceArray.length > 0) {
    const insertionPoint = nodesToReplaceArray[0]
    const parent = insertionPoint.parentNode
    
    for (let i = 0; i < newNodesArray.length; i++) {
       parent?.insertBefore(newNodesArray[i], insertionPoint) 
    }
    for (let i = 0; i <  nodesToReplaceArray.length; i++) {
      removeNode(nodesToReplaceArray[i])
    }
  }
}

export function setElementName (element : any, name: string) {
  element.name = name

    // Workaround IE 6/7 issue
    // - https://github.com/SteveSanderson/knockout/issues/197
    // - http://www.matts411.com/post/setting_the_name_attribute_in_ie_dom/
  if ((ieVersion as any) <= 7) {
    try {
      element.mergeAttributes(document.createElement("<input name='" + element.name + "'/>"), false)
    } catch (e) {} // For IE9 with doc mode "IE9 Standards" and browser mode "IE9 Compatibility View"
  }
}

export function emptyDomNode (domNode: Node) {
  while (domNode.firstChild) {
    removeNode(domNode.firstChild)
  }
}
