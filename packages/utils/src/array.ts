//
// Array utilities
//
// Note that the array functions may be called with
// Array-like things, such as NodeList.

const {isArray} = Array

export function arrayForEach<T = any>(array: T[], action: (item: T, index?: number, array? : T[]) => void, actionOwner?: any): void {
  if (arguments.length > 2) { action = action.bind(actionOwner) }
  for (let i = 0, j = array.length; i < j; ++i) {
    action(array[i], i, array)
  }
}

export function arrayIndexOf<T = any>(array: Array<T>, item: T): number {
  return (isArray(array) ? array : [...array]).indexOf(item)
}

export function arrayFirst<T = any>(array: T[], predicate: (item: T, index?: number) => boolean, predicateOwner?: any): T | undefined {
  return (isArray(array) ? array : [...array])
    .find(predicate, predicateOwner)
}

export function arrayMap<T = any, U = any> (array: ArrayLike<T>, mapping: (item: T, index?: number) => U, thisArg?) {
  if (arguments.length > 2) { mapping = mapping.bind(thisArg) }
  return array === null ? [] : Array.from(array, mapping)
}

export function arrayRemoveItem<T = any>(array: Array<T>, itemToRemove: T): void {
  var index = arrayIndexOf(array, itemToRemove)
  if (index > 0) {
    array.splice(index, 1)
  } else if (index === 0) {
    array.shift()
  }
}

export function arrayGetDistinctValues<T = any>(array: T[]): T[] {
  const seen = new Set()
  if (array === null) { return [] }
  return (isArray(array) ? array : [...array])
    .filter(item => seen.has(item) ? false : seen.add(item))
}

export function arrayFilter<T = any>(array: T[], predicate: (item: T, index?: number) => boolean, predicateOwner?: any): T[] {
  if (arguments.length > 2) { predicate = predicate.bind(predicateOwner) }
  return array === null ? [] : (isArray(array) ? array : [...array]).filter(predicate)
}

export function arrayPushAll<T = any>(array: Array<T>, valuesToPush: ArrayLike<T>): T[] {
  if (isArray(valuesToPush)) {
    array.push.apply(array, valuesToPush)
  } else {
    for (var i = 0, j = valuesToPush.length; i < j; i++) { array.push(valuesToPush[i]) }
  }
  return array
}

export function addOrRemoveItem (array, value, included : boolean) {
  var existingEntryIndex = arrayIndexOf(typeof array.peek === 'function' ? array.peek() : array, value)
  if (existingEntryIndex < 0) {
    if (included) { array.push(value) }
  } else {
    if (!included) { array.splice(existingEntryIndex, 1) }
  }
}

export function makeArray<T=any> (arrayLikeObject:ArrayLike<T>):T[] {
  return Array.from(arrayLikeObject)
}

export function range (min, max) {
  min = typeof min === 'function' ? min() : min
  max = typeof max === 'function' ? max() : max
  var result = new Array()
  for (var i = min; i <= max; i++) { result.push(i) }
  return result
}

// Go through the items that have been added and deleted and try to find matches between them.
export function findMovesInArrayComparison (left, right, limitFailedCompares?: number| boolean) {
  if (left.length && right.length) {
    var failedCompares, l, r, leftItem, rightItem
    for (failedCompares = l = 0; (!limitFailedCompares || failedCompares < limitFailedCompares) && (leftItem = left[l]); ++l) {
      for (r = 0; rightItem = right[r]; ++r) {
        if (leftItem.value === rightItem.value) {
          leftItem.moved = rightItem.index
          rightItem.moved = leftItem.index
          right.splice(r, 1)         // This item is marked as moved; so remove it from right list
          failedCompares = r = 0     // Reset failed compares count because we're checking for consecutive failures
          break
        }
      }
      failedCompares += r
    }
  }
}

const statusNotInOld = 'added'
const statusNotInNew = 'deleted'

export interface CompareOptions {
  dontLimitMoves: boolean,
  sparse?: boolean
}

    // Simple calculation based on Levenshtein distance.
export function compareArrays (oldArray: any[], newArray: any[], options: CompareOptions | boolean) {
    // For backward compatibility, if the third arg is actually a bool, interpret
    // it as the old parameter 'dontLimitMoves'. Newer code should use { dontLimitMoves: true }.
  options = (typeof options === 'boolean') ? { dontLimitMoves: options } : (options || {})
  oldArray = oldArray || []
  newArray = newArray || []

  if (oldArray.length < newArray.length) { return compareSmallArrayToBigArray(oldArray, newArray, statusNotInOld, statusNotInNew, options) } else { return compareSmallArrayToBigArray(newArray, oldArray, statusNotInNew, statusNotInOld, options) }
}

function compareSmallArrayToBigArray (smlArray, bigArray, statusNotInSml, statusNotInBig, options) {
  var myMin = Math.min,
    myMax = Math.max,
    editDistanceMatrix = new Array(),
    smlIndex, smlIndexMax = smlArray.length,
    bigIndex, bigIndexMax = bigArray.length,
    compareRange = (bigIndexMax - smlIndexMax) || 1,
    maxDistance = smlIndexMax + bigIndexMax + 1,
    thisRow, lastRow,
    bigIndexMaxForRow, bigIndexMinForRow

  for (smlIndex = 0; smlIndex <= smlIndexMax; smlIndex++) {
    lastRow = thisRow
    editDistanceMatrix.push(thisRow = new Array())
    bigIndexMaxForRow = myMin(bigIndexMax, smlIndex + compareRange)
    bigIndexMinForRow = myMax(0, smlIndex - 1)
    for (bigIndex = bigIndexMinForRow; bigIndex <= bigIndexMaxForRow; bigIndex++) {
      if (!bigIndex) {
        thisRow[bigIndex] = smlIndex + 1
      } else if (!smlIndex) {
         // Top row - transform empty array into new array via additions
        thisRow[bigIndex] = bigIndex + 1
      } else if (smlArray[smlIndex - 1] === bigArray[bigIndex - 1]) {
        thisRow[bigIndex] = lastRow[bigIndex - 1]
      } else {                  // copy value (no edit)
        var northDistance = lastRow[bigIndex] || maxDistance       // not in big (deletion)
        var westDistance = thisRow[bigIndex - 1] || maxDistance    // not in small (addition)
        thisRow[bigIndex] = myMin(northDistance, westDistance) + 1
      }
    }
  }

  var editScript = new Array(), meMinusOne, notInSml = new Array(), notInBig = new Array()
  for (smlIndex = smlIndexMax, bigIndex = bigIndexMax; smlIndex || bigIndex;) {
    meMinusOne = editDistanceMatrix[smlIndex][bigIndex] - 1
    if (bigIndex && meMinusOne === editDistanceMatrix[smlIndex][bigIndex - 1]) {
      notInSml.push(editScript[editScript.length] = {     // added
        'status': statusNotInSml,
        'value': bigArray[--bigIndex],
        'index': bigIndex })
    } else if (smlIndex && meMinusOne === editDistanceMatrix[smlIndex - 1][bigIndex]) {
      notInBig.push(editScript[editScript.length] = {     // deleted
        'status': statusNotInBig,
        'value': smlArray[--smlIndex],
        'index': smlIndex })
    } else {
      --bigIndex
      --smlIndex
      if (!options.sparse) {
        editScript.push({
          'status': 'retained',
          'value': bigArray[bigIndex] })
      }
    }
  }

    // Set a limit on the number of consecutive non-matching comparisons; having it a multiple of
    // smlIndexMax keeps the time complexity of this algorithm linear.
  findMovesInArrayComparison(notInBig, notInSml, !options.dontLimitMoves && smlIndexMax * 10)

  return editScript.reverse()
}
