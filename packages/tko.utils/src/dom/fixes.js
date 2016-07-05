//
//  DOM node manipulation
//
import { ieVersion } from '../ie.js';

export function fixUpContinuousNodeArray(continuousNodeArray, parentNode) {
    // Before acting on a set of nodes that were previously outputted by a template function, we have to reconcile
    // them against what is in the DOM right now. It may be that some of the nodes have already been removed, or that
    // new nodes might have been inserted in the middle, for example by a binding. Also, there may previously have been
    // leading comment nodes (created by rewritten string-based templates) that have since been removed during binding.
    // So, this function translates the old "map" output array into its best guess of the set of current DOM nodes.
    //
    // Rules:
    //   [A] Any leading nodes that have been removed should be ignored
    //       These most likely correspond to memoization nodes that were already removed during binding
    //       See https://github.com/knockout/knockout/pull/440
    //   [B] Any trailing nodes that have been remove should be ignored
    //       This prevents the code here from adding unrelated nodes to the array while processing rule [C]
    //       See https://github.com/knockout/knockout/pull/1903
    //   [C] We want to output a continuous series of nodes. So, ignore any nodes that have already been removed,
    //       and include any nodes that have been inserted among the previous collection

    if (continuousNodeArray.length) {
        // The parent node can be a virtual element; so get the real parent node
        parentNode = (parentNode.nodeType === 8 && parentNode.parentNode) || parentNode;

        // Rule [A]
        while (continuousNodeArray.length && continuousNodeArray[0].parentNode !== parentNode)
            continuousNodeArray.splice(0, 1);

        // Rule [B]
        while (continuousNodeArray.length > 1 && continuousNodeArray[continuousNodeArray.length - 1].parentNode !== parentNode)
            continuousNodeArray.length--;

        // Rule [C]
        if (continuousNodeArray.length > 1) {
            var current = continuousNodeArray[0], last = continuousNodeArray[continuousNodeArray.length - 1];
            // Replace with the actual new continuous node set
            continuousNodeArray.length = 0;
            while (current !== last) {
                continuousNodeArray.push(current);
                current = current.nextSibling;
            }
            continuousNodeArray.push(last);
        }
    }
    return continuousNodeArray;
}

export function setOptionNodeSelectionState (optionNode, isSelected) {
    // IE6 sometimes throws "unknown error" if you try to write to .selected directly, whereas Firefox struggles with setAttribute. Pick one based on browser.
    if (ieVersion < 7)
        optionNode.setAttribute("selected", isSelected);
    else
        optionNode.selected = isSelected;
}


export function forceRefresh(node) {
    // Workaround for an IE9 rendering bug - https://github.com/SteveSanderson/knockout/issues/209
    if (ieVersion >= 9) {
        // For text nodes and comment nodes (most likely virtual elements), we will have to refresh the container
        var elem = node.nodeType == 1 ? node : node.parentNode;
        if (elem.style)
            elem.style.zoom = elem.style.zoom;
    }
}

export function ensureSelectElementIsRenderedCorrectly(selectElement) {
    // Workaround for IE9 rendering bug - it doesn't reliably display all the text in dynamically-added select boxes unless you force it to re-render by updating the width.
    // (See https://github.com/SteveSanderson/knockout/issues/312, http://stackoverflow.com/questions/5908494/select-only-shows-first-char-of-selected-option)
    // Also fixes IE7 and IE8 bug that causes selects to be zero width if enclosed by 'if' or 'with'. (See issue #839)
    if (ieVersion) {
        var originalWidth = selectElement.style.width;
        selectElement.style.width = 0;
        selectElement.style.width = originalWidth;
    }
}
