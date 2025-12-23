/* eslint no-cond-assign: 0 */
import {
  fixUpContinuousNodeArray,
  replaceDomNodes,
  arrayPushAll,
  anyDomNodeIsAttachedToDocument,
  domData,
  arrayMap,
  arrayForEach,
  virtualElements,
  extend,
  cleanNode,
  removeNode,
  compareArrays
} from '@tko/utils'

import { dependencyDetection, observable } from '@tko/observable'

import type { Observable } from '@tko/observable'

import { computed } from '@tko/computed'

import type { Computed } from '@tko/computed'

type MappingFunction<T = any> = (valueToMap: T, index: number | Observable<number>, nodes: Node[]) => Node[]
type MappingAfterAddFunction<T = any> = (arrayEntry: T, nodes: Node[], index: Observable<number>) => Node[]
type MappingHookFunction<T = any> = (nodes: Node[], index: number, arrayEntry: T) => void

interface MappingOptions<T = any> {
  dontLimitMoves?: boolean
  beforeMove?: MappingHookFunction<T>
  beforeRemove?: MappingHookFunction<T>
  afterAdd?: MappingHookFunction<T>
  afterMove?: MappingHookFunction<T>
  afterRemove?: MappingHookFunction<T>
  sparse?: boolean
}

// Objective:
// * Given an input array, a container DOM node, and a function from array elements to arrays of DOM nodes,
//   map the array elements to arrays of DOM nodes, concatenate together all these arrays, and use them to populate the container DOM node
// * Next time we're given the same combination of things (with the array possibly having mutated), update the container DOM node
//   so that its children is again the concatenation of the mappings of the array elements, but don't re-map any array elements that we
//   previously mapped - retain those nodes, and just insert/delete other ones

// "callbackAfterAddingNodes" will be invoked after any "mapping"-generated nodes are inserted into the container node
// You can use this, for example, to activate bindings on those nodes.

function mapNodeAndRefreshWhenChanged(
  containerNode: Node,
  mapping: MappingFunction,
  valueToMap: any,
  callbackAfterAddingNodes: MappingAfterAddFunction | undefined,
  index: number | Observable<number>
) {
  // Map this array value inside a dependentObservable so we re-map when any dependency changes
  const mappedNodes: Node[] = []
  const dependentObservable: Computed<void> = computed(
    function () {
      const newMappedNodes: Node[] =
        mapping(valueToMap, index, fixUpContinuousNodeArray(mappedNodes, containerNode)) || []

      // On subsequent evaluations, just replace the previously-inserted DOM nodes
      if (mappedNodes.length > 0) {
        replaceDomNodes(mappedNodes, newMappedNodes)
        if (callbackAfterAddingNodes) {
          dependencyDetection.ignore(callbackAfterAddingNodes, null, [valueToMap, newMappedNodes, index])
        }
      }

      // Replace the contents of the mappedNodes array, thereby updating the record
      // of which nodes would be deleted if valueToMap was itself later removed
      mappedNodes.length = 0
      arrayPushAll(mappedNodes, newMappedNodes)
    },
    null,
    {
      disposeWhenNodeIsRemoved: containerNode,
      disposeWhen: function () {
        return !anyDomNodeIsAttachedToDocument(mappedNodes)
      }
    }
  )
  return {
    mappedNodes: mappedNodes,
    dependentObservable: dependentObservable.isActive() ? dependentObservable : undefined
  }
}

const lastMappingResultDomDataKey = domData.nextKey()
const deletedItemDummyValue = domData.nextKey()

export function setDomNodeChildrenFromArrayMapping<T = any>(
  domNode: Node,
  array: any,
  mapping: MappingFunction<T>,
  options?: MappingOptions<T>,
  callbackAfterAddingNodes?: MappingAfterAddFunction<T> | ((...params: any) => any),
  editScript?: any[]
) {
  // Compare the provided array against the previous one
  array = array || []
  if (typeof array.length === 'undefined') {
    array = [array]
  }

  options = options || {}
  const lastMappingResult = domData.get(domNode, lastMappingResultDomDataKey)
  const isFirstExecution = !lastMappingResult

  // Build the new mapping result
  const newMappingResult = new Array()
  let lastMappingResultIndex = 0
  let newMappingResultIndex = 0

  const nodesToDelete: Node[] = []
  const itemsToProcess: MapDataType[] = []
  const itemsForBeforeRemoveCallbacks: MapDataType[] = []
  const itemsForMoveCallbacks: MapDataType[] = []
  const itemsForAfterAddCallbacks: MapDataType[] = []
  let mapData: MapDataType | null
  let countWaitingForRemove = 0

  type MapDataType = {
    arrayEntry: any
    indexObservable: Observable<number>
    mappedNodes?: Node[]
    dependentObservable?: Computed<void>
    initialized?: boolean
  }

  function itemAdded(value: any) {
    mapData = { arrayEntry: value, indexObservable: observable(newMappingResultIndex++) }
    newMappingResult.push(mapData)
    itemsToProcess.push(mapData)
    if (!isFirstExecution) {
      itemsForAfterAddCallbacks.push(mapData)
    }
  }

  function itemMovedOrRetained(oldPosition: number) {
    mapData = lastMappingResult[oldPosition]
    if (newMappingResultIndex !== oldPosition) {
      itemsForMoveCallbacks.push(mapData!)
    }
    // Since updating the index might change the nodes, do so before calling fixUpContinuousNodeArray
    mapData!.indexObservable(newMappingResultIndex++)
    fixUpContinuousNodeArray(mapData!.mappedNodes, domNode)
    newMappingResult.push(mapData)
    itemsToProcess.push(mapData!)
  }

  function callCallback(callback: MappingHookFunction<T> | undefined, items: any[]) {
    if (callback) {
      for (let i = 0, n = items.length; i < n; i++) {
        arrayForEach(items[i].mappedNodes, function (node) {
          callback(node, i, items[i].arrayEntry)
        })
      }
    }
  }

  if (isFirstExecution) {
    arrayForEach(array, itemAdded)
  } else {
    if (!editScript || (lastMappingResult && lastMappingResult['_countWaitingForRemove'])) {
      // Compare the provided array against the previous one
      const lastArray = arrayMap(lastMappingResult, function (x) {
        return x.arrayEntry
      })
      const compareOptions = { dontLimitMoves: options.dontLimitMoves, sparse: true }
      editScript = compareArrays(lastArray, array, compareOptions)
    }

    for (
      let i = 0, editScriptItem: number[], movedIndex: number, itemIndex: number;
      (editScriptItem = editScript[i]);
      i++
    ) {
      movedIndex = editScriptItem['moved']
      itemIndex = editScriptItem['index']
      switch (editScriptItem['status']) {
        case 'deleted':
          while (lastMappingResultIndex < itemIndex) {
            itemMovedOrRetained(lastMappingResultIndex++)
          }
          if (movedIndex === undefined) {
            mapData = lastMappingResult[lastMappingResultIndex]

            // Stop tracking changes to the mapping for these nodes
            if (mapData!.dependentObservable) {
              mapData!.dependentObservable.dispose()
              mapData!.dependentObservable = undefined
            }

            // Queue these nodes for later removal
            if (fixUpContinuousNodeArray(mapData!.mappedNodes, domNode).length) {
              if (options.beforeRemove) {
                newMappingResult.push(mapData)
                itemsToProcess.push(mapData!)
                countWaitingForRemove++
                if (mapData!.arrayEntry === deletedItemDummyValue) {
                  mapData = null
                } else {
                  itemsForBeforeRemoveCallbacks.push(mapData!)
                }
              }
              if (mapData && mapData.mappedNodes) {
                nodesToDelete.push.apply(nodesToDelete, mapData.mappedNodes)
              }
            }
          }
          lastMappingResultIndex++
          break

        case 'added':
          while (newMappingResultIndex < itemIndex) {
            itemMovedOrRetained(lastMappingResultIndex++)
          }
          if (movedIndex !== undefined) {
            itemMovedOrRetained(movedIndex)
          } else {
            itemAdded(editScriptItem['value'])
          }
          break
      }
    }

    while (newMappingResultIndex < array.length) {
      itemMovedOrRetained(lastMappingResultIndex++)
    }

    // Record that the current view may still contain deleted items
    // because it means we won't be able to use a provided editScript.
    newMappingResult['_countWaitingForRemove'] = countWaitingForRemove
  }

  // Store a copy of the array items we just considered so we can difference it next time
  domData.set(domNode, lastMappingResultDomDataKey, newMappingResult)

  // Call beforeMove first before any changes have been made to the DOM
  callCallback(options.beforeMove, itemsForMoveCallbacks)

  // Next remove nodes for deleted items (or just clean if there's a beforeRemove callback)
  arrayForEach(nodesToDelete, options.beforeRemove ? cleanNode : removeNode)

  // Next add/reorder the remaining items (will include deleted items if there's a beforeRemove callback)
  for (let k = 0, nextNode = virtualElements.firstChild(domNode), lastNode, node; (mapData = itemsToProcess[k]); k++) {
    // Get nodes for newly added items
    if (!mapData.mappedNodes) {
      extend(
        mapData,
        mapNodeAndRefreshWhenChanged(
          domNode,
          mapping,
          mapData.arrayEntry,
          callbackAfterAddingNodes,
          mapData.indexObservable
        )
      )
    }

    // Put nodes in the right place if they aren't there already
    for (let j = 0; (node = mapData.mappedNodes![j]); nextNode = node.nextSibling, lastNode = node, j++) {
      if (node !== nextNode) {
        virtualElements.insertAfter(domNode, node, lastNode)
      }
    }

    // Run the callbacks for newly added nodes (for example, to apply bindings, etc.)
    if (!mapData.initialized && callbackAfterAddingNodes) {
      callbackAfterAddingNodes(mapData.arrayEntry, mapData.mappedNodes!, mapData.indexObservable)
      mapData.initialized = true
    }
  }

  // If there's a beforeRemove callback, call it after reordering.
  // Note that we assume that the beforeRemove callback will usually be used to remove the nodes using
  // some sort of animation, which is why we first reorder the nodes that will be removed. If the
  // callback instead removes the nodes right away, it would be more efficient to skip reordering them.
  // Perhaps we'll make that change in the future if this scenario becomes more common.
  callCallback(options.beforeRemove, itemsForBeforeRemoveCallbacks)

  // Replace the stored values of deleted items with a dummy value. This provides two benefits: it marks this item
  // as already "removed" so we won't call beforeRemove for it again, and it ensures that the item won't match up
  // with an actual item in the array and appear as "retained" or "moved".
  for (let x = 0; x < itemsForBeforeRemoveCallbacks.length; ++x) {
    itemsForBeforeRemoveCallbacks[x].arrayEntry = deletedItemDummyValue
  }

  // Finally call afterMove and afterAdd callbacks
  callCallback(options.afterMove, itemsForMoveCallbacks)
  callCallback(options.afterAdd, itemsForAfterAddCallbacks)
}
