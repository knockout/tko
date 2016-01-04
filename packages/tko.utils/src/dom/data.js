//
// DOM node data
//
import {createSymbolOrString} from '../symbol.js'

var uniqueId = 0;
var dataStoreKeyExpandoPropertyName = createSymbolOrString("__ko__data_store");
var dataStore = {};


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

export function get(node, key) {
    var allDataForNode = getAll(node, false);
    return allDataForNode === undefined ? undefined : allDataForNode[key];
}

export function set(node, key, value) {
    if (value === undefined) {
        // Make sure we don't actually create a new domData key if we are actually deleting a value
        if (getAll(node, false) === undefined)
            return;
    }
    var allDataForNode = getAll(node, true);
    allDataForNode[key] = value;
}

export function clear(node) {
    var dataStoreKey = node[dataStoreKeyExpandoPropertyName];
    if (dataStoreKey) {
        delete dataStore[dataStoreKey];
        node[dataStoreKeyExpandoPropertyName] = null;
        return true; // Exposing "did clean" flag purely so specs can infer whether things have been cleaned up as intended
    }
    return false;
}

export function nextKey() {
    return (uniqueId++) + dataStoreKeyExpandoPropertyName;
}
