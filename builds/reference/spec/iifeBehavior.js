/**
 * Test the behavior of consumers of TKO i.e. importers.
 */
import '../dist/browser.min'

describe('tko/build.reference', () => {
  describe('global', () => {
    it('exports a ko object', () => {
      const tko = globalThis.tko
      assert.notEqual(tko.cleanNode, undefined)
     })
  })
})
