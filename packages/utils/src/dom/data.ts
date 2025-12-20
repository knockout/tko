//
// DOM node data
//
import { ieVersion } from '../ie'

const datastoreTime = new Date().getTime()
const dataStoreKeyExpandoPropertyName = `__ko__${datastoreTime}`
const dataStoreSymbol = Symbol('Knockout data')
let dataStore = {}
let uniqueId = 0

// Prevent prototype pollution by restricting special property names
function isSafeKey(key: string): boolean {
  return key !== '__proto__' && key !== 'constructor' && key !== 'prototype';
}

/*
 * We considered using WeakMap, but it has a problem in IE 11 and Edge that
 * prevents using it cross-window, so instead we just store the data directly
 * on the node. See https://github.com/knockout/knockout/issues/2141
 */
const modern = {
  getDataForNode (node : Node, createIfNotFound: boolean) {
    let dataForNode = node[dataStoreSymbol]
    if (!dataForNode && createIfNotFound) {
      dataForNode = node[dataStoreSymbol] = {}
    }
    return dataForNode
  },

  clear (node : Node) {
    if (node[dataStoreSymbol]) {
      delete node[dataStoreSymbol]
      return true
    }
    return false
  }
}

/**
 * Old IE versions have memory issues if you store objects on the node, so we
 * use a separate data storage and link to it from the node using a string key.
 */
const IE = {
  getDataForNode (node: Node, createIfNotFound: boolean) {
    let dataStoreKey = node[dataStoreKeyExpandoPropertyName]
    const hasExistingDataStore = dataStoreKey && (dataStoreKey !== 'null') && dataStore[dataStoreKey]
    if (!hasExistingDataStore) {
      if (!createIfNotFound) {
        return undefined
      }
      dataStoreKey = node[dataStoreKeyExpandoPropertyName] = 'ko' + uniqueId++
      dataStore[dataStoreKey] = {}
    }
    return dataStore[dataStoreKey]
  },

  clear (node : Node) {
    const dataStoreKey = node[dataStoreKeyExpandoPropertyName]
    if (dataStoreKey) {
      delete dataStore[dataStoreKey]
      node[dataStoreKeyExpandoPropertyName] = null
      return true // Exposing 'did clean' flag purely so specs can infer whether things have been cleaned up as intended
    }
    return false
  }
}

const {getDataForNode, clear} = ieVersion ? IE : modern

/**
 * Create a unique key-string identifier.
 */
export function nextKey () {
  return (uniqueId++) + dataStoreKeyExpandoPropertyName
}

function get (node: Node, key: string) {
  if (!isSafeKey(key)) throw new Error('Unsafe key for DOM data: ' + key)

  const dataForNode = getDataForNode(node, false)
  return dataForNode && dataForNode[key]
}

function set (node : Node, key : string, value : any) {
   if (!isSafeKey(key)) throw new Error('Unsafe key for DOM data: ' + key)
  // Make sure we don't actually create a new domData key if we are actually deleting a value
  let dataForNode = getDataForNode(node, value !== undefined /* createIfNotFound */)
  if (dataForNode) {
    dataForNode[key] = value
  }
}

function getOrSet (node : Node, key : string, value : any) {
  if (!isSafeKey(key)) throw new Error('Unsafe key for DOM data: ' + key)
  const dataForNode = getDataForNode(node, true, /* createIfNotFound */)
  return dataForNode[key] || (dataForNode[key] = value)
}

export { get, set, getOrSet, clear }
