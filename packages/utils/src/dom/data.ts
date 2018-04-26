//
// DOM node data
//
import { ieVersion } from '../ie';

const datastoreTime = new Date().getTime();
const dataStoreKeyExpandoPropertyName = `__ko__${datastoreTime}`;
const dataStoreSymbol = Symbol('Knockout data');
const dataStore: any = {};
let uniqueId = 0;

/*
 * We considered using WeakMap, but it has a problem in IE 11 and Edge that
 * prevents using it cross-window, so instead we just store the data directly
 * on the node. See https://github.com/knockout/knockout/issues/2141
 */
const modern = {
  getDataForNode(node: any, createIfNotFound?: boolean): any {
    let dataForNode = node[dataStoreSymbol];
    if (!dataForNode && createIfNotFound) {
      dataForNode = node[dataStoreSymbol] = {};
    }
    return dataForNode;
  },

  clear(node: Node) {
    const internalNode = node as any;
    if (internalNode[dataStoreSymbol]) {
      delete internalNode[dataStoreSymbol];
      return true;
    }
    return false;
  }
};

/**
 * Old IE versions have memory issues if you store objects on the node, so we
 * use a separate data storage and link to it from the node using a string key.
 */
const IE = {
  getDataForNode(node: any, createIfNotFound?: boolean): any {
    let dataStoreKey = node[dataStoreKeyExpandoPropertyName];
    const hasExistingDataStore = dataStoreKey && (dataStoreKey !== 'null') && dataStore[dataStoreKey];
    if (!hasExistingDataStore) {
      if (!createIfNotFound) {
        return undefined;
      }
      dataStoreKey = node[dataStoreKeyExpandoPropertyName] = 'ko' + uniqueId++;
      dataStore[dataStoreKey] = {};
    }
    return dataStore[dataStoreKey];
  },

  clear(node: Node) {
    const internalNode = node as any;
    const dataStoreKey = internalNode[dataStoreKeyExpandoPropertyName];
    if (dataStoreKey) {
      delete dataStore[dataStoreKey];
      internalNode[dataStoreKeyExpandoPropertyName] = null;
      return true; // Exposing 'did clean' flag purely so specs can infer whether things have been cleaned up as intended
    }
    return false;
  }
};

const {getDataForNode, clear} = ieVersion ? IE : modern;

/**
 * Create a unique key-string identifier.
 */
export function nextKey() {
  return (uniqueId++) + dataStoreKeyExpandoPropertyName;
}

function get<T= any>(node: Node, key: string) {
  const dataForNode = getDataForNode(node, false);
  return dataForNode && dataForNode[key];
}

function set<T= any>(node: Node, key: string, value?: T) {
  // Make sure we don't actually create a new domData key if we are actually deleting a value
  const dataForNode = getDataForNode(node, value !== undefined /* createIfNotFound */);
  if (dataForNode) {
    dataForNode[key] = value;
  }
}

function getOrSet<T= any>(node: Node, key: string, value?: T) {
  const dataForNode = getDataForNode(node, true, /* createIfNotFound */)
  return dataForNode[key] || (dataForNode[key] = value)
}

export { get, set, getOrSet, clear }
