//
// DOM node data
//
//
var dataStoreKeyExpandoPropertyName = "__ko__data" + new Date();
var dataStore;
var uniqueId = 0;
var get;
var set;
var clear;

/**
 * --- Legacy getter/setter (may cause memory leaks) ---
 */
function getAll(node, createIfNotFound) {
    var dataStoreKey = node[dataStoreKeyExpandoPropertyName];
    var hasExistingDataStore = dataStoreKey && (dataStoreKey !== "null") && dataStore[dataStoreKey];
    if (!hasExistingDataStore) {
        if (!createIfNotFound)
            return undefined;
        dataStoreKey = node[dataStoreKeyExpandoPropertyName] = "ko" + uniqueId++;
        dataStore[dataStoreKey] = {};
    }
    return dataStore[dataStoreKey];
}

function legacyGet(node, key) {
    var allDataForNode = getAll(node, false);
    return allDataForNode === undefined ? undefined : allDataForNode[key];
}

function legacySet(node, key, value) {
    if (value === undefined) {
        // Make sure we don't actually create a new domData key if we are actually deleting a value
        if (getAll(node, false) === undefined)
            return;
    }
    var allDataForNode = getAll(node, true);
    allDataForNode[key] = value;
}

function legacyClear(node) {
    var dataStoreKey = node[dataStoreKeyExpandoPropertyName];
    if (dataStoreKey) {
        delete dataStore[dataStoreKey];
        node[dataStoreKeyExpandoPropertyName] = null;
        return true; // Exposing "did clean" flag purely so specs can infer whether things have been cleaned up as intended
    }
    return false;
}

/**
 * WeakMap get/set/clear
 */

function wmGet(node, key) {
    return (dataStore.get(node) || {})[key];
}

function wmSet(node, key, value) {
    var dataForNode;
    if (dataStore.has(node)) {
        dataForNode = dataStore.get(node);
    } else {
        dataForNode = {};
        dataStore.set(node, dataForNode);
    }
    dataForNode[key] = value;
}

function wmClear(node) {
    dataStore.set(node, {});
}


if ('WeakMap' in window) {
    dataStore = new WeakMap();
    get = wmGet;
    set = wmSet;
    clear = wmClear;
} else {
    dataStore = {};
    get = legacyGet;
    set = legacySet;
    clear = legacyClear;
}



/**
 * Create a unique key-string identifier.
 * FIXME: This should be deprecated.
 */
export function nextKey() {
    return (uniqueId++) + dataStoreKeyExpandoPropertyName;
}


export { get, set, clear };