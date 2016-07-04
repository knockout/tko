//
// Array utilities
//
/* eslint no-cond-assign: 0 */

export function arrayForEach(array, action) {
    for (var i = 0, j = array.length; i < j; i++)
        action(array[i], i);
}

export function arrayIndexOf(array, item) {
    // IE9
    if (typeof Array.prototype.indexOf == "function")
        return Array.prototype.indexOf.call(array, item);
    for (var i = 0, j = array.length; i < j; i++)
        if (array[i] === item)
            return i;
    return -1;
}

export function arrayFirst(array, predicate, predicateOwner) {
    for (var i = 0, j = array.length; i < j; i++)
        if (predicate.call(predicateOwner, array[i], i))
            return array[i];
    return null;
}

export function arrayRemoveItem(array, itemToRemove) {
    var index = arrayIndexOf(array, itemToRemove);
    if (index > 0) {
        array.splice(index, 1);
    }
    else if (index === 0) {
        array.shift();
    }
}

export function arrayGetDistinctValues(array) {
    array = array || [];
    var result = [];
    for (var i = 0, j = array.length; i < j; i++) {
        if (arrayIndexOf(result, array[i]) < 0)
            result.push(array[i]);
    }
    return result;
}

export function arrayMap(array, mapping) {
    array = array || [];
    var result = [];
    for (var i = 0, j = array.length; i < j; i++)
        result.push(mapping(array[i], i));
    return result;
}

export function arrayFilter(array, predicate) {
    array = array || [];
    var result = [];
    for (var i = 0, j = array.length; i < j; i++)
        if (predicate(array[i], i))
            result.push(array[i]);
    return result;
}

export function arrayPushAll(array, valuesToPush) {
    if (valuesToPush instanceof Array)
        array.push.apply(array, valuesToPush);
    else
        for (var i = 0, j = valuesToPush.length; i < j; i++)
            array.push(valuesToPush[i]);
    return array;
}

export function addOrRemoveItem(array, value, included) {
    var existingEntryIndex = arrayIndexOf(typeof array.peek === 'function' ? array.peek() : array, value);
    if (existingEntryIndex < 0) {
        if (included)
            array.push(value);
    } else {
        if (!included)
            array.splice(existingEntryIndex, 1);
    }
}


export function makeArray(arrayLikeObject) {
    var result = [];
    for (var i = 0, j = arrayLikeObject.length; i < j; i++) {
        result.push(arrayLikeObject[i]);
    }
    return result;
}


export function range(min, max) {
    min = typeof min === 'function' ? min() : min;
    max = typeof max === 'function' ? max() : max;
    var result = [];
    for (var i = min; i <= max; i++)
        result.push(i);
    return result;
}

// Go through the items that have been added and deleted and try to find matches between them.
export function findMovesInArrayComparison(left, right, limitFailedCompares) {
    if (left.length && right.length) {
        var failedCompares, l, r, leftItem, rightItem;
        for (failedCompares = l = 0; (!limitFailedCompares || failedCompares < limitFailedCompares) && (leftItem = left[l]); ++l) {
            for (r = 0; rightItem = right[r]; ++r) {
                if (leftItem['value'] === rightItem['value']) {
                    leftItem['moved'] = rightItem['index'];
                    rightItem['moved'] = leftItem['index'];
                    right.splice(r, 1);         // This item is marked as moved; so remove it from right list
                    failedCompares = r = 0;     // Reset failed compares count because we're checking for consecutive failures
                    break;
                }
            }
            failedCompares += r;
        }
    }
}



var statusNotInOld = 'added', statusNotInNew = 'deleted';

    // Simple calculation based on Levenshtein distance.
export function compareArrays(oldArray, newArray, options) {
    // For backward compatibility, if the third arg is actually a bool, interpret
    // it as the old parameter 'dontLimitMoves'. Newer code should use { dontLimitMoves: true }.
    options = (typeof options === 'boolean') ? { 'dontLimitMoves': options } : (options || {});
    oldArray = oldArray || [];
    newArray = newArray || [];

    if (oldArray.length < newArray.length)
        return compareSmallArrayToBigArray(oldArray, newArray, statusNotInOld, statusNotInNew, options);
    else
        return compareSmallArrayToBigArray(newArray, oldArray, statusNotInNew, statusNotInOld, options);
}


function compareSmallArrayToBigArray(smlArray, bigArray, statusNotInSml, statusNotInBig, options) {
    var myMin = Math.min,
        myMax = Math.max,
        editDistanceMatrix = [],
        smlIndex, smlIndexMax = smlArray.length,
        bigIndex, bigIndexMax = bigArray.length,
        compareRange = (bigIndexMax - smlIndexMax) || 1,
        maxDistance = smlIndexMax + bigIndexMax + 1,
        thisRow, lastRow,
        bigIndexMaxForRow, bigIndexMinForRow;

    for (smlIndex = 0; smlIndex <= smlIndexMax; smlIndex++) {
        lastRow = thisRow;
        editDistanceMatrix.push(thisRow = []);
        bigIndexMaxForRow = myMin(bigIndexMax, smlIndex + compareRange);
        bigIndexMinForRow = myMax(0, smlIndex - 1);
        for (bigIndex = bigIndexMinForRow; bigIndex <= bigIndexMaxForRow; bigIndex++) {
            if (!bigIndex)
                thisRow[bigIndex] = smlIndex + 1;
            else if (!smlIndex)  // Top row - transform empty array into new array via additions
                thisRow[bigIndex] = bigIndex + 1;
            else if (smlArray[smlIndex - 1] === bigArray[bigIndex - 1])
                thisRow[bigIndex] = lastRow[bigIndex - 1];                  // copy value (no edit)
            else {
                var northDistance = lastRow[bigIndex] || maxDistance;       // not in big (deletion)
                var westDistance = thisRow[bigIndex - 1] || maxDistance;    // not in small (addition)
                thisRow[bigIndex] = myMin(northDistance, westDistance) + 1;
            }
        }
    }

    var editScript = [], meMinusOne, notInSml = [], notInBig = [];
    for (smlIndex = smlIndexMax, bigIndex = bigIndexMax; smlIndex || bigIndex;) {
        meMinusOne = editDistanceMatrix[smlIndex][bigIndex] - 1;
        if (bigIndex && meMinusOne === editDistanceMatrix[smlIndex][bigIndex-1]) {
            notInSml.push(editScript[editScript.length] = {     // added
                'status': statusNotInSml,
                'value': bigArray[--bigIndex],
                'index': bigIndex });
        } else if (smlIndex && meMinusOne === editDistanceMatrix[smlIndex - 1][bigIndex]) {
            notInBig.push(editScript[editScript.length] = {     // deleted
                'status': statusNotInBig,
                'value': smlArray[--smlIndex],
                'index': smlIndex });
        } else {
            --bigIndex;
            --smlIndex;
            if (!options['sparse']) {
                editScript.push({
                    'status': "retained",
                    'value': bigArray[bigIndex] });
            }
        }
    }

    // Set a limit on the number of consecutive non-matching comparisons; having it a multiple of
    // smlIndexMax keeps the time complexity of this algorithm linear.
    findMovesInArrayComparison(notInBig, notInSml, !options['dontLimitMoves'] && smlIndexMax * 10);

    return editScript.reverse();
}
