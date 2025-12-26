// index.js
// --------
// Fast For Each
//
// Employing sound techniques to make a faster Knockout foreach binding.
// --------

import {
  arrayForEach,
  cleanNode,
  options,
  virtualElements,
  createSymbolOrString,
  domData,
  domNodeIsContainedBy
} from '@tko/utils'

import { isObservable, unwrap, observable } from '@tko/observable'

import type { ObservableArray } from '@tko/observable'

import { contextFor, applyBindingsToDescendants, AsyncBindingHandler } from '@tko/bind'

import type { AllBindings } from '@tko/bind'

//      Utilities
const MAX_LIST_SIZE = 9007199254740991

// from https://github.com/jonschlinkert/is-plain-object
function isPlainObject(o): o is Record<string, any> {
  return !!o && typeof o === 'object' && o.constructor === Object
}

interface ChangeMap {
  added: ChangeAddItem[]
  deleted: any[]
}

interface ChangeAddItemBase {
  status: 'added'
  index: number
}

interface ChangeAddBatchItem extends ChangeAddItemBase {
  isBatch: true
  values: any[]
}

interface ChangeAddOneItem extends ChangeAddItemBase {
  isBatch?: false
  value: any
}

type ChangeAddItem = ChangeAddBatchItem | ChangeAddOneItem

const supportsDocumentFragment = options.document && typeof options.document.createDocumentFragment === 'function'

// Get a copy of the (possibly virtual) child nodes of the given element,
// put them into a container, then empty the given node.
function makeTemplateNode(sourceNode) {
  const container = document.createElement('div')
  let parentNode
  if (sourceNode.content) {
    // For e.g. <template> tags
    parentNode = sourceNode.content
  } else if (sourceNode.tagName === 'SCRIPT') {
    parentNode = document.createElement('div')
    parentNode.innerHTML = sourceNode.text
  } else {
    // Anything else e.g. <div>
    parentNode = sourceNode
  }
  arrayForEach(virtualElements.childNodes(parentNode), function (child) {
    // FIXME - This cloneNode could be expensive; we may prefer to iterate over the
    // parentNode children in reverse (so as not to foul the indexes as childNodes are
    // removed from parentNode when inserted into the container)
    if (child) {
      container.insertBefore(child.cloneNode(true), null)
    }
  })
  return container
}

// Mimic a KO change item 'add'
function valueToChangeAddItem(value, index): ChangeAddItem {
  return { status: 'added', value: value, index: index }
}

// store a symbol for caching the pending delete info index in the data item objects
const PENDING_DELETE_INDEX_SYM = createSymbolOrString('_ko_ffe_pending_delete_index')

export class ForEachBinding extends AsyncBindingHandler {
  // NOTE: valid valueAccessors include:
  //    []
  //    observable([])
  //    observableArray([])
  //    computed
  //    {data: array, name: string, as: string}
  afterAdd
  override allBindings: AllBindings
  static animateFrame
  as
  beforeRemove
  container
  changeSubs: any
  data
  generateContext
  $indexHasBeenRequested: boolean
  templateNode
  changeQueue: any[]
  firstLastNodesList: { first: Node; last: Node }[]
  indexesToDelete: any[]
  isNotEmpty: any
  rendering_queued: boolean
  pendingDeletes: any[]
  afterQueueFlush
  beforeQueueFlush

  constructor(params) {
    super(params)
    const settings: any = {}
    if (isPlainObject(this.value)) {
      Object.assign(settings, this.value)
    }

    this.as = settings.as || this.allBindings.get('as')

    this.data = settings.data || (unwrap(this.$context.$rawData) === this.value ? this.$context.$rawData : this.value)

    this.container = virtualElements.isStartComment(this.$element) ? this.$element.parentNode : this.$element
    this.generateContext = this.createContextGenerator(this.as)
    this.$indexHasBeenRequested = false

    this.templateNode = makeTemplateNode(
      settings.templateNode || (settings.name ? document.getElementById(settings.name)?.cloneNode(true) : this.$element)
    )
    ;['afterAdd', 'beforeRemove', 'afterQueueFlush', 'beforeQueueFlush'].forEach(p => {
      this[p] = settings[p] || this.allBindings.get(p)
    })

    this.changeQueue = new Array()
    this.firstLastNodesList = new Array()
    this.indexesToDelete = new Array()
    this.rendering_queued = false
    this.pendingDeletes = new Array()

    // Expose the conditional so that if the `foreach` data is empty, successive
    // 'else' bindings will appear.
    this.isNotEmpty = observable(Boolean(unwrap(this.data).length))
    domData.set(this.$element, 'conditional', { elseChainSatisfied: this.isNotEmpty })

    // Remove existing content.
    virtualElements.emptyNode(this.$element)

    // Prime content
    const primeData = unwrap(this.data)
    if (primeData && primeData.map) {
      this.onArrayChange(primeData.map(valueToChangeAddItem), true)
    } else {
      this.completeBinding()
    }

    // Watch for changes
    if (isObservable(this.data)) {
      if (!(this.data as ObservableArray).indexOf) {
        // Make sure the observable is trackable.
        this.data = this.data.extend({ trackArrayChanges: true })
      }
      this.changeSubs = this.data.subscribe(this.onArrayChange, this, 'arrayChange')
    }
  }

  override dispose() {
    if (this.changeSubs) {
      this.changeSubs.dispose()
    }
    this.flushPendingDeletes()
  }

  // If the array changes we register the change.
  onArrayChange(changeSet, isInitial) {
    const changeMap: ChangeMap = { added: [], deleted: [] }

    // knockout array change notification index handling:
    // - sends the original array indexes for deletes
    // - sends the new array indexes for adds
    // - sorts them all by index in ascending order
    // because of this, when checking for possible batch additions, any delete can be between to adds with neighboring indexes, so only additions should be checked
    for (let i = 0, len = changeSet.length; i < len; i++) {
      if (changeMap.added.length && changeSet[i].status === 'added') {
        let lastAdd = changeMap.added[changeMap.added.length - 1]
        const lastIndex = lastAdd.isBatch ? lastAdd.index + lastAdd.values!.length - 1 : lastAdd.index
        if (lastIndex + 1 === changeSet[i].index) {
          if (!lastAdd.isBatch) {
            // transform the last addition into a batch addition object
            lastAdd = { isBatch: true, status: 'added', index: lastAdd.index, values: [lastAdd.value] }
            changeMap.added.splice(changeMap.added.length - 1, 1, lastAdd)
          }
          lastAdd.values!.push(changeSet[i].value)
          continue
        }
      }

      changeMap[changeSet[i].status].push(changeSet[i])
    }

    if (changeMap.deleted.length > 0) {
      this.changeQueue.push.apply(this.changeQueue, changeMap.deleted)
      this.changeQueue.push({ status: 'clearDeletedIndexes' })
    }

    this.changeQueue.push.apply(this.changeQueue, changeMap.added)
    // Once a change is registered, the ticking count-down starts for the processQueue.
    if (this.changeQueue.length > 0 && !this.rendering_queued) {
      this.rendering_queued = true
      if (isInitial) {
        this.processQueue()
      } else {
        ForEachBinding.animateFrame.call(window, () => this.processQueue())
      }
    }
  }

  startQueueFlush() {
    // Callback so folks can do things before the queue flush.
    if (typeof this.beforeQueueFlush === 'function') {
      this.beforeQueueFlush(this.changeQueue)
    }
  }

  endQueueFlush() {
    // Callback so folks can do things.
    if (typeof this.afterQueueFlush === 'function') {
      this.afterQueueFlush(this.changeQueue)
    }
  }

  // Reflect all the changes in the queue in the DOM, then wipe the queue.
  processQueue() {
    const isEmpty = !unwrap(this.data).length
    let lowestIndexChanged = MAX_LIST_SIZE

    this.startQueueFlush()

    arrayForEach(this.changeQueue, changeItem => {
      if (typeof changeItem.index === 'number') {
        lowestIndexChanged = Math.min(lowestIndexChanged, changeItem.index)
      }
      this[changeItem.status](changeItem)
    })
    this.flushPendingDeletes()
    this.rendering_queued = false

    // Update our indexes.
    if (this.$indexHasBeenRequested) {
      this.updateIndexes(lowestIndexChanged)
    }

    this.endQueueFlush()
    this.changeQueue = new Array()

    // Update the conditional exposed on the domData
    if (isEmpty !== !this.isNotEmpty()) {
      this.isNotEmpty(!isEmpty)
    }
  }

  /**
   * Once the $index has been asked for once, start calculating it.
   * Note that this significantly degrades performance, from O(1) to O(n)
   * for arbitrary changes to the list.
   */
  _first$indexRequest(ctx$indexRequestedFrom) {
    this.$indexHasBeenRequested = true
    for (let i = 0, len = this.firstLastNodesList.length; i < len; ++i) {
      const ctx = this.getContextStartingFrom(this.firstLastNodesList[i].first)
      // Overwrite the defineProperty.
      if (ctx) {
        ctx.$index = observable(i)
      }
    }
    return ctx$indexRequestedFrom.$index()
  }

  _contextExtensions($ctx) {
    Object.assign($ctx, { $list: this.data })
    if (this.$indexHasBeenRequested) {
      $ctx.$index = $ctx.$index || observable()
    } else {
      Object.defineProperty($ctx, '$index', {
        value: () => this._first$indexRequest($ctx),
        configurable: true,
        writable: true
      })
    }
    return $ctx
  }

  /**
   * Return a function that generates the context for a given node.
   *
   * We generate a single function that reduces our inner-loop calculations,
   * which has a good chance of being optimized by the browser.
   *
   * @param  {string} as  The name given to each item in the list
   * @param  {bool} index Whether to calculate indexes
   * @return {function}   A function(dataValue) that returns the context
   */
  createContextGenerator(as) {
    const $ctx = this.$context
    if (as) {
      return v => this._contextExtensions($ctx.extend({ [as]: v }))
    } else {
      return v => $ctx.createChildContext(v, undefined, ctx => this._contextExtensions(ctx))
    }
  }

  updateFirstLastNodesList(index, children) {
    const first = children[0]
    const last = children[children.length - 1]
    this.firstLastNodesList.splice(index, 0, { first, last })
  }

  // Process a changeItem with {status: 'added', ...}
  added(changeItem: ChangeAddItem) {
    const index = changeItem.index
    const valuesToAdd = changeItem.isBatch ? changeItem.values : [changeItem.value]
    const referenceElement = this.getLastNodeBeforeIndex(index)
    // gather all childnodes for a possible batch insertion
    const allChildNodes: Node[] = []
    const asyncBindingResults = new Array()
    let children

    for (let i = 0, len = valuesToAdd.length; i < len; ++i) {
      // we check if we have a pending delete with reusable nodesets for this data, and if yes, we reuse one nodeset
      const pendingDelete = this.getPendingDeleteFor(valuesToAdd[i])
      if (pendingDelete && pendingDelete.nodesets.length) {
        children = pendingDelete.nodesets.pop()
        this.updateFirstLastNodesList(index + i, children)
      } else {
        const templateClone = this.templateNode.cloneNode(true)
        children = virtualElements.childNodes(templateClone)
        this.updateFirstLastNodesList(index + i, children)

        // Apply bindings first, and then process child nodes,
        // because bindings can add childnodes.
        const bindingResult = applyBindingsToDescendants(this.generateContext(valuesToAdd[i]), templateClone)
        asyncBindingResults.push(bindingResult)
      }

      allChildNodes.push(...children)
    }

    if (typeof this.afterAdd === 'function') {
      this.afterAdd({
        nodeOrArrayInserted: this.insertAllAfter(allChildNodes, referenceElement),
        foreachInstance: this
      })
    } else {
      this.insertAllAfter(allChildNodes, referenceElement)
    }

    this.completeBinding(Promise.all(asyncBindingResults))
  }

  getNodesForIndex(index) {
    const result = new Array()
    let ptr = this.firstLastNodesList[index].first
    const last = this.firstLastNodesList[index].last
    result.push(ptr)
    while (ptr && ptr !== last) {
      ptr = ptr.nextSibling!
      result.push(ptr)
    }
    return result
  }

  getLastNodeBeforeIndex(index) {
    if (index < 1 || index - 1 >= this.firstLastNodesList.length) {
      return null
    }
    return this.firstLastNodesList[index - 1].last
  }

  /**
   * Get the active (focused) node, if it's a child of the given node.
   */
  activeChildElement(node) {
    const active = document.activeElement
    if (domNodeIsContainedBy(active, node)) {
      return active
    }
    return null
  }

  insertAllAfter(nodeOrNodeArrayToInsert, insertAfterNode) {
    let frag
    let len
    let i
    let active: any = null
    const containerNode = this.$element

    // Poor man's node and array check.
    if (nodeOrNodeArrayToInsert.nodeType === undefined && nodeOrNodeArrayToInsert.length === undefined) {
      throw new Error('Expected a single node or a node array')
    }
    if (nodeOrNodeArrayToInsert.nodeType !== undefined) {
      active = this.activeChildElement(nodeOrNodeArrayToInsert)
      virtualElements.insertAfter(containerNode, nodeOrNodeArrayToInsert, insertAfterNode)
      return [nodeOrNodeArrayToInsert]
    } else if (nodeOrNodeArrayToInsert.length === 1) {
      active = this.activeChildElement(nodeOrNodeArrayToInsert[0])
      virtualElements.insertAfter(containerNode, nodeOrNodeArrayToInsert[0], insertAfterNode)
    } else if (supportsDocumentFragment) {
      frag = document.createDocumentFragment()
      for (i = 0, len = nodeOrNodeArrayToInsert.length; i !== len; ++i) {
        active = active || this.activeChildElement(nodeOrNodeArrayToInsert[i])
        frag.appendChild(nodeOrNodeArrayToInsert[i])
      }
      virtualElements.insertAfter(containerNode, frag, insertAfterNode)
    } else {
      // Nodes are inserted in reverse order - pushed down immediately after
      // the last node for the previous item or as the first node of element.
      for (i = nodeOrNodeArrayToInsert.length - 1; i >= 0; --i) {
        active = active || this.activeChildElement(nodeOrNodeArrayToInsert[i])
        const child = nodeOrNodeArrayToInsert[i]
        if (!child) {
          break
        }
        virtualElements.insertAfter(containerNode, child, insertAfterNode)
      }
    }

    if (active) {
      active.focus()
    }

    return nodeOrNodeArrayToInsert
  }

  // checks if the deleted data item should be handled with delay for a possible reuse at additions
  shouldDelayDeletion(data) {
    return data && (typeof data === 'object' || typeof data === 'function')
  }

  // gets the pending deletion info for this data item
  getPendingDeleteFor(data: any[]) {
    const index = data && data[PENDING_DELETE_INDEX_SYM]
    if (index === undefined) return null
    return this.pendingDeletes[index]
  }

  // tries to find the existing pending delete info for this data item, and if it can't, it registeres one
  getOrCreatePendingDeleteFor(data) {
    let pd = this.getPendingDeleteFor(data)
    if (pd) {
      return pd
    }
    pd = { data: data, nodesets: [] }
    data[PENDING_DELETE_INDEX_SYM] = this.pendingDeletes.length
    this.pendingDeletes.push(pd)
    return pd
  }

  // Process a changeItem with {status: 'deleted', ...}
  deleted(changeItem) {
    // if we should delay the deletion of this data, we add the nodeset to the pending delete info object
    if (this.shouldDelayDeletion(changeItem.value)) {
      const pd = this.getOrCreatePendingDeleteFor(changeItem.value)
      pd.nodesets.push(this.getNodesForIndex(changeItem.index))
    } else {
      // simple data, just remove the nodes
      this.removeNodes(this.getNodesForIndex(changeItem.index))
    }
    this.indexesToDelete.push(changeItem.index)
  }

  // removes a set of nodes from the DOM
  removeNodes(nodes) {
    if (!nodes.length) {
      return
    }

    function removeFn() {
      const parent = nodes[0].parentNode
      for (let i = nodes.length - 1; i >= 0; --i) {
        cleanNode(nodes[i])
        parent.removeChild(nodes[i])
      }
    }

    if (this.beforeRemove) {
      const beforeRemoveReturn = this.beforeRemove({ nodesToRemove: nodes, foreachInstance: this }) || {}
      // If beforeRemove returns a `then`–able e.g. a Promise, we remove
      // the nodes when that thenable completes.  We pass any errors to
      // ko.onError.
      if (typeof beforeRemoveReturn.then === 'function') {
        beforeRemoveReturn.then(removeFn, options.onError)
      }
    } else {
      removeFn()
    }
  }

  // flushes the pending delete info store
  // this should be called after queue processing has finished, so that data items and remaining (not reused) nodesets get cleaned up
  // we also call it on dispose not to leave any mess
  flushPendingDeletes() {
    for (let i = 0, len = this.pendingDeletes.length; i !== len; ++i) {
      const pd = this.pendingDeletes[i]
      while (pd.nodesets.length) {
        this.removeNodes(pd.nodesets.pop())
      }
      if (pd.data && pd.data[PENDING_DELETE_INDEX_SYM] !== undefined) {
        delete pd.data[PENDING_DELETE_INDEX_SYM]
      }
    }
    this.pendingDeletes = new Array()
  }

  // We batch our deletion of item indexes in our parallel array.
  // See brianmhunt/knockout-fast-foreach#6/#8
  clearDeletedIndexes() {
    // We iterate in reverse on the presumption (following the unit tests) that KO's diff engine
    // processes diffs (esp. deletes) monotonically ascending i.e. from index 0 -> N.
    for (let i = this.indexesToDelete.length - 1; i >= 0; --i) {
      this.firstLastNodesList.splice(this.indexesToDelete[i], 1)
    }
    this.indexesToDelete = new Array()
  }

  updateIndexes(fromIndex) {
    let ctx
    for (let i = fromIndex, len = this.firstLastNodesList.length; i < len; ++i) {
      ctx = this.getContextStartingFrom(this.firstLastNodesList[i].first)
      if (ctx) {
        ctx.$index(i)
      }
    }
  }

  getContextStartingFrom(node) {
    let ctx
    while (node) {
      ctx = contextFor(node)
      if (ctx) {
        return ctx
      }
      node = node.nextSibling
    }
  }

  /**
   * Set whether the binding is always synchronous.
   * Useful during testing.
   */
  static setSync(toggle) {
    const w = options.global
    if (toggle) {
      ForEachBinding.animateFrame = function (frame) {
        frame()
      }
    } else {
      ForEachBinding.animateFrame =
        w.requestAnimationFrame
        || w.webkitRequestAnimationFrame
        || w.mozRequestAnimationFrame
        || w.msRequestAnimationFrame
        || function (cb) {
          return w.setTimeout(cb, 1000 / 60)
        }
    }
  }

  override get controlsDescendants() {
    return true
  }
  static override get allowVirtualElements() {
    return true
  }

  /* TODO: Remove; for legacy/testing */
  static get ForEach() {
    return this
  }
  static get PENDING_DELETE_INDEX_SYM() {
    return PENDING_DELETE_INDEX_SYM
  }
}
