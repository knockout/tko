import { Builder } from 'tko.builder'

import { VirtualProvider } from 'tko.provider.virtual'
import { DataBindProvider } from 'tko.provider.databind'
import { ComponentProvider } from 'tko.provider.component'
import { AttributeProvider } from 'tko.provider.attr'
import { MultiProvider } from 'tko.provider.multi'
import {
  TextMustacheProvider, AttributeMustacheProvider
} from 'tko.provider.mustache'
import {
  NativeProvider
} from 'tko.provider.native'

import { bindings as coreBindings } from 'tko.binding.core'
import { bindings as templateBindings } from 'tko.binding.template'
import { bindings as ifBindings } from 'tko.binding.if'
import { bindings as foreachBindings } from 'tko.binding.foreach'
import { bindings as componentBindings } from 'tko.binding.component'

import { filters } from 'tko.filter.punches'

import components from 'tko.utils.component'

const builder = new Builder({
  filters,
  provider: new MultiProvider({
    providers: [
      new AttributeMustacheProvider(),
      new TextMustacheProvider(),
      new ComponentProvider(),
      new DataBindProvider(),
      new VirtualProvider(),
      new AttributeProvider(),
      new NativeProvider()
    ]
  }),
  bindings: [
    coreBindings,
    templateBindings,
    ifBindings,
    foreachBindings,
    componentBindings,
    { each: foreachBindings.foreach }
  ]
})

export default builder.create({
  version: '{{VERSION}}',
  components,
  Component: components.ComponentABC
})
