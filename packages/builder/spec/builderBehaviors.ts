import { VirtualProvider } from '@tko/provider.virtual'
import { bindings as ifBindings } from '@tko/binding.if'
import { options } from '@tko/utils'

import { Builder } from '../dist'

describe('Builder', () => {
  it('creates a ko instance', function () {
    // `new Builder({...})` mutates the shared `@tko/utils` options
    // (filters + bindingProviderInstance). Under Vitest's per-file
    // module isolation the mutation is invisible to later specs;
    // under the browser /tests runner every spec shares module
    // state, so an unrestored mutation here wipes `options.filters`
    // (which at this point holds the punctuation filters from
    // `@tko/filter.punches`) and breaks ~14 downstream filter-
    // lookup tests.
    // @ts-ignore — global helper from mocha-test-helpers.js
    restoreAfter(options, 'filters')
    // @ts-ignore — global helper from mocha-test-helpers.js
    restoreAfter(options, 'bindingProviderInstance')
    // We're just testing that the builder constructs, here.
    const builder = new Builder({ filters: {}, provider: new VirtualProvider(), bindings: [ifBindings], options: {} })
  })
})
