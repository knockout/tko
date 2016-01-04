//
// DOM node disposal
//
import * as domData from './data.js'
import {arrayRemoveItem, arrayPushAll} from '../array.js'

var domDataKey = domData.nextKey();
var cleanableNodeTypes = { 1: true, 8: true, 9: true };       // Element, Comment, Document
var cleanableNodeTypesWithDescendants = { 1: true, 9: true }; // Element, Document
var jQueryCleanNodeFn = jQueryInstance
    ? jQueryInstance['cleanData'] : null;

function getDisposeCallbacksCollection(node, createIfNotFound) {
    var allDisposeCallbacks = domData.get(node, domDataKey);
    if ((allDisposeCallbacks === undefined) && createIfNotFound) {
        allDisposeCallbacks = [];
        domData.set(node, domDataKey, allDisposeCallbacks);
    }
    return allDisposeCallbacks;
}
function destroyCallbacksCollection(node) {
    domData.set(node, domDataKey, undefined);
}

function cleanSingleNode(node) {
    // Run all the dispose callbacks
    var callbacks = getDisposeCallbacksCollection(node, false);
    if (callbacks) {
        callbacks = callbacks.slice(0); // Clone, as the array may be modified during iteration (typically, callbacks will remove themselves)
        for (var i = 0; i < callbacks.length; i++)
            callbacks[i](node);
    }

    // Erase the DOM data
    domData.clear(node);

    // Perform cleanup needed by external libraries (currently only jQuery, but can be extended)
    cleanExternalData(node);

    // Clear any immediate-child comment nodes, as these wouldn't have been found by
    // node.getElementsByTagName("*") in cleanNode() (comment nodes aren't elements)
    if (cleanableNodeTypesWithDescendants[node.nodeType])
        cleanImmediateCommentTypeChildren(node);
}

function cleanImmediateCommentTypeChildren(nodeWithChildren) {
    var child, nextChild = nodeWithChildren.firstChild;
    while (child = nextChild) {
        nextChild = child.nextSibling;
        if (child.nodeType === 8)
            cleanSingleNode(child);
    }
}

// Exports
export function addDisposeCallback(node, callback) {
    if (typeof callback != "function")
        throw new Error("Callback must be a function");
    getDisposeCallbacksCollection(node, true).push(callback);
}

export function removeDisposeCallback(node, callback) {
    var callbacksCollection = getDisposeCallbacksCollection(node, false);
    if (callbacksCollection) {
        arrayRemoveItem(callbacksCollection, callback);
        if (callbacksCollection.length == 0)
            destroyCallbacksCollection(node);
    }
}

export function cleanNode(node) {
    // First clean this node, where applicable
    if (cleanableNodeTypes[node.nodeType]) {
        cleanSingleNode(node);

        // ... then its descendants, where applicable
        if (cleanableNodeTypesWithDescendants[node.nodeType]) {
            // Clone the descendants list in case it changes during iteration
            var descendants = [];
            arrayPushAll(descendants, node.getElementsByTagName("*"));
            for (var i = 0, j = descendants.length; i < j; i++)
                cleanSingleNode(descendants[i]);
        }
    }
    return node;
}

export function removeNode(node) {
    cleanNode(node);
    if (node.parentNode)
        node.parentNode.removeChild(node);
}

export function cleanExternalData (node) {
    // Special support for jQuery here because it's so commonly used.
    // Many jQuery plugins (including jquery.tmpl) store data using jQuery's equivalent of domData
    // so notify it to tear down any resources associated with the node & descendants here.
    if (jQueryCleanNodeFn) {
        jQueryCleanNodeFn([node]);
    }
}
