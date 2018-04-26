//
// DOM node disposal
//
/* eslint no-cond-assign: 0 */
import * as domData from './data';
import {arrayRemoveItem} from '../array';
import {jQueryInstance} from '../jquery';

const domDataKey = domData.nextKey();

// Node types:
// 1: Element
// 8: Comment
// 9: Document
const cleanableNodeTypes: {[nodeType: number]: boolean|undefined} = { 1: true, 8: true, 9: true };
const cleanableNodeTypesWithDescendants: {[nodeType: number]: boolean|undefined} = { 1: true, 9: true };

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

// Expose supplemental node cleaning functions.
export type NodeCleanerCallback = (node: Node) => void;
export const otherNodeCleanerFunctions: NodeCleanerCallback[] = [];

function cleanSingleNode(node: Node) {
  // Run all the dispose callbacks
  let callbacks = getDisposeCallbacksCollection(node, false);
  if (callbacks) {
    callbacks = callbacks.slice(0); // Clone, as the array may be modified during iteration (typically, callbacks will remove themselves)
    for (const cb of callbacks) {
      callbacks(node);
    }
  }

    // Erase the DOM data
  domData.clear(node);

    // Perform cleanup needed by external libraries (currently only jQuery, but can be extended)
  for (let i = 0, j = otherNodeCleanerFunctions.length; i < j; ++i) {
   otherNodeCleanerFunctions[i](node);
  }

    // Clear any immediate-child comment nodes, as these wouldn't have been found by
    // node.getElementsByTagName('*') in cleanNode() (comment nodes aren't elements)
  if (cleanableNodeTypesWithDescendants[node.nodeType]) { cleanImmediateCommentTypeChildren(node); }
}

function cleanImmediateCommentTypeChildren(nodeWithChildren: Node) {
  const children = nodeWithChildren.childNodes;
  let cleanedNode: Node;

  // tslint:disable-next-line:prefer-for-of
  for (let i = 0; i < children.length; ++i) {
    if (children[i].nodeType === 8) {
      cleanSingleNode(cleanedNode = children[i]);
      if (children[i] !== cleanedNode) {
        throw Error('ko.cleanNode: An already cleaned node was removed from the document');
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

function isCleanableNodeWithDescendants(node: Node): node is Element {
  return cleanableNodeTypesWithDescendants[node.nodeType] === true;
}

export function cleanNode(node: Node) {
    // First clean this node, where applicable
  if (cleanableNodeTypes[node.nodeType]) {
    cleanSingleNode(node);

        // ... then its descendants, where applicable
    if (isCleanableNodeWithDescendants(node)) {
      const descendants = node.getElementsByTagName('*');

      // tslint:disable-next-line:prefer-for-of
      for (let i = 0; i < descendants.length; ++i) {
        const cleanedNode = descendants[i];
        cleanSingleNode(cleanedNode);
        if (descendants[i] !== cleanedNode) {
          throw Error('ko.cleanNode: An already cleaned node was removed from the document');
        }
      }
    }
  }
  return node;
}

export function removeNode(node: Node) {
  cleanNode(node);
  if (node.parentNode) { node.parentNode.removeChild(node); }
}

// Special support for jQuery here because it's so commonly used.
// Many jQuery plugins (including jquery.tmpl) store data using jQuery's equivalent of domData
// so notify it to tear down any resources associated with the node & descendants here.
export function cleanjQueryData(node: Node) {
  // Note: cleanData is an internal jQuery function
  const jQueryCleanNodeFn = jQueryInstance
        ? (jQueryInstance as any).cleanData : null;

  if (jQueryCleanNodeFn) {
    jQueryCleanNodeFn([node]);
  }
}

otherNodeCleanerFunctions.push(cleanjQueryData);
