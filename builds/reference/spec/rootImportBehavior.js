/**
 * Test the behavior of consumers of TKO i.e. importers.
 */

import tkoRoot from '..'

describe('tko/build.reference', () => {
  describe('root import', () => {
    it('exports a ko object', () => {
      assert.notEqual(tkoRoot.cleanNode, undefined)
    })
  })
})
