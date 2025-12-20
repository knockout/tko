import { VirtualProvider } from '@tko/provider.virtual'
import { bindings as ifBindings } from '@tko/binding.if'

import { Builder } from '../dist'

describe('Builder', () => {
  it('creates a ko instance', () => {
    // We're just testing that the builder constructs, here.
    const builder = new Builder({ filters: {}, provider: new VirtualProvider(), bindings: [ifBindings], options: {} })
  })
})
