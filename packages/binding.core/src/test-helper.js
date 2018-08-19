
import {
    arrayFilter, arrayMap, selectExtensions
} from '@tko/utils'

/**
 * Note that these matchers cannot be included in jasmine-13-helpers.js.
 *
 * When using Rollup to create the tests, it creates multiple files e.g.
 * - optionsBehaviours
 * - checkedBehaviours
 * - ...
 *
 * This is problematic if domData access is imported via jasmine-13-helper,
 * since there'll be only one instance of domData imported i.e.  the imports
 * should look like this:
 *
 * - optionsBehaviours
 *   - utils/dom/data
 * - checkedBehaviours
 *   - utils/dom/data/
 *
 * But what happens is that the singleton in data.js (dataStore) is created
 * in jasmine-13-helper, so when it's referenced it always comes from
 * the very first import.  So in checkedBehaviours any reference to domData
 * would get it from the `dataStore` in optionsBehaviours (because it was
 * imported first).
 *
 * Or at least that seems to be the dragon here.
 */

export var matchers = {
  toHaveSelectedValues (expectedValues) {
    const selectedNodes = arrayFilter(this.actual.childNodes, node => node.selected)
    const selectedValues = arrayMap(selectedNodes, node => selectExtensions.readValue(node))
    this.actual = selectedValues   // Fix explanatory message
    return this.env.equals_(selectedValues, expectedValues)
  }
}
