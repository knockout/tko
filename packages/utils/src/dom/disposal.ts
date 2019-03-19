//
// DOM node disposal
//
/* eslint no-cond-assign: 0 */
import * as domData from './data.js'
import { default as options } from '../options.js'
import {arrayRemoveItem, arrayIndexOf} from '../array.js'
import {jQueryInstance} from '../jquery.js'

const domDataKey = domData.nextKey();

// Node types:
// 1: Element
// 8: Comment
// 9: Document
const cleanableNodeTypes: {[nodeType: number]: boolean|undefined} = { 1: true, 8: true, 9: true };
const cleanableNodeTypesWithDescendants: {[nodeType: number]: boolean|undefined} = { 1: true, 9: true };
type CleanableNode = Element | Comment | Document
type CleanableNodeWithDescendants = Element | Document

function getDisposeCallbacksCollection(node: Node, createIfNotFound?: boolean) {
  let allDisposeCallbacks = domData.get(node, domDataKey);
  if ((allDisposeCallbacks === undefined) && createIfNotFound) {
    allDisposeCallbacks = [];
    domData.set(node, domDataKey, allDisposeCallbacks);
  }
  return allDisposeCallbacks;
}

function destroyCallbacksCollection(node: Node) {
  domData.set(node, domDataKey, undefined);
}

function cleanSingleNode(node: CleanableNode) {
  // Run all the dispose callbacks
  let callbacks = getDisposeCallbacksCollection(node, false);
  if (callbacks) {
    callbacks = callbacks.slice(0); // Clone, as the array may be modified during iteration (typically, callbacks will remove themselves)
    for (const cb of callbacks) {
      cb(node);
    }
  }

    // Erase the DOM data
  domData.clear(node);

    // Perform cleanup needed by external libraries (currently only jQuery, but can be extended)
  for (let i = 0, j = otherNodeCleanerFunctions.length; i < j; ++i) {
    otherNodeCleanerFunctions[i](node);
  }

  if (options.cleanExternalData) {
    options.cleanExternalData(node)
  }

    // Clear any immediate-child comment nodes, as these wouldn't have been found by
    // node.getElementsByTagName('*') in cleanNode() (comment nodes aren't elements)
  if (cleanableNodeTypesWithDescendants[node.nodeType]) {
    cleanNodesInList((node as CleanableNodeWithDescendants).childNodes, true /* onlyComments */)
  }
}

function cleanNodesInList (nodeList: NodeListOf<ChildNode>, onlyComments?: boolean) {
  const cleanedNodes = []
  let lastCleanedNode
  for (var i = 0; i < nodeList.length; i++) {
    if (!onlyComments || nodeList[i].nodeType === 8) {
      cleanSingleNode(cleanedNodes[cleanedNodes.length] = lastCleanedNode = nodeList[i] as Comment);
      if (nodeList[i] !== lastCleanedNode) {
        while (i-- && arrayIndexOf(cleanedNodes, nodeList[i]) === -1) {}
      }
    }
  }
}

// Exports
export type DisposeCallback = () => void;

export function addDisposeCallback(node: Node, callback: DisposeCallback) {
  if (typeof callback !== 'function') { throw new Error('Callback must be a function'); }
  getDisposeCallbacksCollection(node, true).push(callback);
}

export function removeDisposeCallback(node: Node, callback: DisposeCallback) {
  const callbacksCollection = getDisposeCallbacksCollection(node, false);
  if (callbacksCollection) {
    arrayRemoveItem(callbacksCollection, callback);
    if (callbacksCollection.length === 0) { destroyCallbacksCollection(node); }
  }
}

export function cleanNode (node: Node) {
  // First clean this node, where applicable
  if (cleanableNodeTypes[node.nodeType]) {
    cleanSingleNode(node as CleanableNode);

    // ... then its descendants, where applicable
    if (cleanableNodeTypesWithDescendants[node.nodeType]) {
      cleanNodesInList((node as any).getElementsByTagName('*'));
    }
  }
  return node;
}

export function removeNode(node: Node) {
  cleanNode(node);
  if (node.parentNode) { node.parentNode.removeChild(node); }
}

// Expose supplemental node cleaning functions.
export type NodeCleanerCallback = (node: Node) => void;
export const otherNodeCleanerFunctions: NodeCleanerCallback[] = [];

export function addCleaner (fn: NodeCleanerCallback) {
  otherNodeCleanerFunctions.push(fn)
}

export function removeCleaner (fn: NodeCleanerCallback) {
  const fnIndex = otherNodeCleanerFunctions.indexOf(fn)
  if (fnIndex >= 0) { otherNodeCleanerFunctions.splice(fnIndex, 1) }
}

// Special support for jQuery here because it's so commonly used.
// Many jQuery plugins (including jquery.tmpl) store data using jQuery's equivalent of domData
// so notify it to tear down any resources associated with the node & descendants here.
export function cleanjQueryData (node: Node) {
  var jQueryCleanNodeFn = jQueryInstance ? (jQueryInstance as any).cleanData : null

  if (jQueryCleanNodeFn) {
    jQueryCleanNodeFn([node]);
  }
}

otherNodeCleanerFunctions.push(cleanjQueryData);
