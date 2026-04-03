//
//  DOM node manipulation
//

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
    parentNode = (parentNode.nodeType === Node.COMMENT_NODE && parentNode.parentNode) || parentNode

    // Rule [A]
    while (continuousNodeArray.length && continuousNodeArray[0].parentNode !== parentNode) {
      continuousNodeArray.splice(0, 1)
    }

    // Rule [B]
    while (
      continuousNodeArray.length > 1
      && continuousNodeArray[continuousNodeArray.length - 1].parentNode !== parentNode
    ) {
      continuousNodeArray.length--
    }

    // Rule [C]
    if (continuousNodeArray.length > 1) {
      let current = continuousNodeArray[0],
        last = continuousNodeArray[continuousNodeArray.length - 1]
      // Replace with the actual new continuous node set
      continuousNodeArray.length = 0
      while (current !== last) {
        continuousNodeArray.push(current)
        current = current.nextSibling
      }
      continuousNodeArray.push(last)
    }
  }
  return continuousNodeArray
}

export function setOptionNodeSelectionState(optionNode, isSelected) {
  optionNode.selected = isSelected
}
