//
// Array utilities
//
// Note that the array functions may be called with
// Array-like things, such as NodeList.

const {isArray} = Array;

// export function arrayForEach<T, TThis>(array: T[], action: (this: TThis, item: T, index: number, array: T[]) => void, thisArg: TThis): void;
export function arrayForEach<T>(array: T[], action: (item: T, index: number, array: T[]) => void, thisArg?: any) {
  if (thisArg) { action = action.bind(thisArg); }
  for (let i = 0, j = array.length; i < j; ++i) {
    action(array[i], i, array);
  }
}

export function arrayIndexOf<T>(array: T[], item: T) {
  return (isArray(array) ? array : [...array]).indexOf(item);
}

// export function arrayFirst<T, TThis>(array: T[], predicate: (this: TThis, value: T, index: number, obj: T[]) => boolean, predicateOwner: TThis): void;
export function arrayFirst<T>(array: T[], predicate: (value: T, index: number, obj: T[]) => boolean, predicateOwner?: any) {
  const arr: T[] = (isArray(array) ? array : [...array]);
  return arr.find(predicate, predicateOwner) || undefined;
}

export function arrayMap<T, U= T, TTHis= void>(array: T[], mapping: (this: TTHis, v: T, k: number) => U, thisArg: TTHis): U[];
export function arrayMap<T, U= T>(array: T[] = [], mapping?: (v: T, k: number) => U, thisArg?: any) {
  return thisArg && mapping ? Array.from<T, U>(array, mapping.bind(thisArg)) : Array.from(array);
}

export function arrayRemoveItem<T>(array: T[], itemToRemove: T) {
  const index = arrayIndexOf(array, itemToRemove);
  if (index > 0) {
    array.splice(index, 1);
  } else if (index === 0) {
    array.shift();
  }
}

export function arrayGetDistinctValues<T>(array: T[] = []) {
  const seen = new Set();
  return (isArray(array) ? array : [...array])
    .filter(item => seen.has(item) ? false : seen.add(item));
}

export function arrayFilter<T, TThis= void>(array: T[], predicate: (this: TThis, value: T, index: number, array: T[]) => any, thisArg: TThis): T[];
export function arrayFilter<T>(array: T[], predicate: (value: T, index: number, array: T[]) => any, thisArg?: any) {
  if (thisArg) { predicate = predicate.bind(thisArg); }
  return (isArray(array) ? array : [...array]).filter(predicate);
}

export function arrayPushAll<T>(array: T[], valuesToPush: ArrayLike<T>) {
  if (isArray(valuesToPush)) {
    array.push.apply(array, valuesToPush);
  } else {
    for (let i = 0, j = valuesToPush.length; i < j; i++) {
      array.push(valuesToPush[i]);
    }
  }

  return array;
}

export function addOrRemoveItem<T>(array: T[], value: T, included?: boolean) {
  const existingEntryIndex = arrayIndexOf('peek' in array && typeof (array as any).peek === 'function' ? (array as any).peek() : array, value);
  if (existingEntryIndex < 0) {
    if (included) { array.push(value); }
  } else {
    if (!included) { array.splice(existingEntryIndex, 1); }
  }
}

export function makeArray<T>(arrayLikeObject: ArrayLike<T>) {
  return Array.from(arrayLikeObject);
}

export type RangeFunction = () => number;
export function range(min: number|RangeFunction, max: number|RangeFunction) {
  min = typeof min === 'function' ? min() : min;
  max = typeof max === 'function' ? max() : max;
  const result = [];

  for (let i = min; i <= max; i++) { result.push(i); }

  return result;
}

// Go through the items that have been added and deleted and try to find matches between them.
export function findMovesInArrayComparison(left: any[], right: any[], limitFailedCompares: number|boolean) {
  if (left.length && right.length) {
    let failedCompares, l, r, leftItem, rightItem;

    // tslint:disable-next-line:no-conditional-assignment
    for (failedCompares = l = 0; (!limitFailedCompares || failedCompares < limitFailedCompares) && (leftItem = left[l]); ++l) {
      // tslint:disable-next-line:no-conditional-assignment
      for (r = 0; rightItem = right[r]; ++r) {
        if (leftItem.value === rightItem.value) {
          leftItem.moved = rightItem.index;
          rightItem.moved = leftItem.index;
          right.splice(r, 1);         // This item is marked as moved; so remove it from right list
          failedCompares = r = 0;     // Reset failed compares count because we're checking for consecutive failures
          break;
        }
      }
      failedCompares += r;
    }
  }
}

const statusNotInOld = 'added', statusNotInNew = 'deleted';

export interface ICompareArrayOptions {
  dontLimitMoves?: boolean;
  sparse?: boolean;
}

    // Simple calculation based on Levenshtein distance.
export function compareArrays<T>(oldArray: T[], newArray: T[], options ?: boolean|ICompareArrayOptions) {
    // For backward compatibility, if the third arg is actually a bool, interpret
    // it as the old parameter 'dontLimitMoves'. Newer code should use { dontLimitMoves: true }.
  options = (typeof options === 'boolean') ? { dontLimitMoves: options } : (options || {});
  oldArray = oldArray || [];
  newArray = newArray || [];

  if (oldArray.length < newArray.length) {
     return compareSmallArrayToBigArray(oldArray, newArray, statusNotInOld, statusNotInNew, options);
  } else {
     return compareSmallArrayToBigArray(newArray, oldArray, statusNotInNew, statusNotInOld, options);
  }
}

function compareSmallArrayToBigArray<T>(smlArray: T[], bigArray: T[], statusNotInSml: any, statusNotInBig: any, options: ICompareArrayOptions) {
  // tslint:disable:prefer-const
  let myMin = Math.min,
    myMax = Math.max,
    editDistanceMatrix = [],
    smlIndex, smlIndexMax = smlArray.length,
    bigIndex, bigIndexMax = bigArray.length,
    compareRange = (bigIndexMax - smlIndexMax) || 1,
    maxDistance = smlIndexMax + bigIndexMax + 1,
    thisRow, lastRow: any,
    bigIndexMaxForRow, bigIndexMinForRow;

  for (smlIndex = 0; smlIndex <= smlIndexMax; smlIndex++) {
    lastRow = thisRow;
    editDistanceMatrix.push(thisRow = []);
    bigIndexMaxForRow = myMin(bigIndexMax, smlIndex + compareRange);
    bigIndexMinForRow = myMax(0, smlIndex - 1);
    for (bigIndex = bigIndexMinForRow; bigIndex <= bigIndexMaxForRow; bigIndex++) {
      if (!bigIndex) {
        thisRow[bigIndex] = smlIndex + 1;
      } else if (!smlIndex) {
        // Top row - transform empty array into new array via additions
        thisRow[bigIndex] = bigIndex + 1;
      } else if (smlArray[smlIndex - 1] === bigArray[bigIndex - 1]) {
        // copy value (no edit)
        thisRow[bigIndex] = lastRow && lastRow[bigIndex - 1];
      } else {
        const northDistance = lastRow && lastRow[bigIndex] || maxDistance;       // not in big (deletion)
        const westDistance: any = thisRow[bigIndex - 1] || maxDistance;    // not in small (addition)
        thisRow[bigIndex] = myMin(northDistance, westDistance) + 1;
      }
    }
  }

  let editScript = [], meMinusOne, notInSml = [], notInBig = [];
  for (smlIndex = smlIndexMax, bigIndex = bigIndexMax; smlIndex || bigIndex;) {
    meMinusOne = editDistanceMatrix[smlIndex][bigIndex] - 1;
    if (bigIndex && meMinusOne === editDistanceMatrix[smlIndex][bigIndex - 1]) {
      notInSml.push(editScript[editScript.length] = {     // added
        status: statusNotInSml,
        value: bigArray[--bigIndex],
        index: bigIndex });
    } else if (smlIndex && meMinusOne === editDistanceMatrix[smlIndex - 1][bigIndex]) {
      notInBig.push(editScript[editScript.length] = {     // deleted
        status: statusNotInBig,
        value: smlArray[--smlIndex],
        index: smlIndex });
    } else {
      --bigIndex;
      --smlIndex;
      if (!options.sparse) {
        editScript.push({
          status: 'retained',
          value: bigArray[bigIndex] });
      }
    }
  }

    // Set a limit on the number of consecutive non-matching comparisons; having it a multiple of
    // smlIndexMax keeps the time complexity of this algorithm linear.
  findMovesInArrayComparison(notInBig, notInSml, !options.dontLimitMoves && smlIndexMax * 10);

  return editScript.reverse();
}
