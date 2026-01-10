//
// DOM node data
//

const datastoreTime = new Date().getTime()
const dataStoreKeyExpandoPropertyName = `__ko__${datastoreTime}`
const dataStoreSymbol = Symbol('Knockout data')
const dataStore = {}
let uniqueId = 0

// Prevent prototype pollution by restricting special property names
function isSafeKey(key: string): boolean {
  return key !== '__proto__' && key !== 'constructor' && key !== 'prototype'
}

/*
 * We considered using WeakMap, but it has a problem in IE 11 and Edge that
 * prevents using it cross-window, so instead we just store the data directly
 * on the node. See https://github.com/knockout/knockout/issues/2141
 */
function getDataForNode(node: Node, createIfNotFound: boolean): any {
  let dataForNode = node[dataStoreSymbol]
  if (!dataForNode && createIfNotFound) {
    dataForNode = node[dataStoreSymbol] = {}
  }
  return dataForNode
}

function clear(node: Node): boolean {
  if (node[dataStoreSymbol]) {
    delete node[dataStoreSymbol]
    return true
  }
  return false
}

/**
 * Create a unique key-string identifier.
 */
export function nextKey() {
  return uniqueId++ + dataStoreKeyExpandoPropertyName
}

function get(node: Node, key: string) {
  if (!isSafeKey(key)) throw new Error('Unsafe key for DOM data: ' + key)

  const dataForNode = getDataForNode(node, false)
  return dataForNode && dataForNode[key]
}

function set(node: Node, key: string, value: any) {
  if (!isSafeKey(key)) throw new Error('Unsafe key for DOM data: ' + key)
  // Make sure we don't actually create a new domData key if we are actually deleting a value
  const dataForNode = getDataForNode(node, value !== undefined /* createIfNotFound */)
  if (dataForNode) {
    dataForNode[key] = value
  }
}

function getOrSet(node: Node, key: string, value: any) {
  if (!isSafeKey(key)) throw new Error('Unsafe key for DOM data: ' + key)
  const dataForNode = getDataForNode(node, true /* createIfNotFound */)
  return dataForNode[key] || (dataForNode[key] = value)
}

export { get, set, getOrSet, clear }
