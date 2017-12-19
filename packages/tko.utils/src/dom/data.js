//
// DOM node data
//
import { ieVersion } from '../ie'

const datastoreTime = new Date().getTime()
const dataStoreKeyExpandoPropertyName = `__ko__${datastoreTime}`
const dataStoreSymbol = Symbol('Knockout data')
var dataStore
let uniqueId = 0

/*
 * We considered using WeakMap, but it has a problem in IE 11 and Edge that
 * prevents using it cross-window, so instead we just store the data directly
 * on the node. See https://github.com/knockout/knockout/issues/2141
 */
const modern = {
  getDataForNode (node, createIfNotFound) {
    let dataForNode = node[dataStoreSymbol]
    if (!dataForNode && createIfNotFound) {
      dataForNode = node[dataStoreSymbol] = {}
    }
    return dataForNode
  },

  clear (node) {
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
  getDataforNode (node, createIfNotFound) {
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

  clear (node) {
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

function get (node, key) {
  const dataForNode = getDataForNode(node, false)
  return dataForNode && dataForNode[key]
}

function set (node, key, value) {
  // Make sure we don't actually create a new domData key if we are actually deleting a value
  var dataForNode = getDataForNode(node, value !== undefined /* createIfNotFound */)
  dataForNode && (dataForNode[key] = value)
}

export { get, set, clear }
