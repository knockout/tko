import { Builder } from '@tko/builder'

import { VirtualProvider } from '@tko/provider.virtual'
import { DataBindProvider } from '@tko/provider.databind'
import { ComponentProvider } from '@tko/provider.component'
import { AttributeProvider } from '@tko/provider.attr'
import { MultiProvider } from '@tko/provider.multi'

import { bindings as coreBindings } from '@tko/binding.core'
import { bindings as templateBindings } from '@tko/binding.template'
import { bindings as ifBindings } from '@tko/binding.if'
import { bindings as foreachBindings } from '@tko/binding.foreach'
import { bindings as componentBindings } from '@tko/binding.component'

import { filters } from '@tko/filter.punches'

import components from '@tko/utils.component'

import { functionRewrite } from '@tko/utils.functionrewrite'

import { options as defaultOptions } from '@tko/utils'

/**
 * expressionRewriting is deprecated in TKO because we have our own JS
 * parser now.  This is here only for legacy compatibility.
 */
const dataBindProvider = new DataBindProvider()
const expressionRewriting = {
  preProcessBindings: s => dataBindProvider.preProcessBindings(s)
}

const provider = new MultiProvider({providers: [
  new ComponentProvider(),
  dataBindProvider,
  new VirtualProvider(),
  new AttributeProvider()
]})

const builder = new Builder({
  provider,
  bindings: [
    coreBindings,
    templateBindings,
    ifBindings,
    componentBindings,
    { each: foreachBindings.foreach }
  ],
  extenders: {},
  filters,
  options: {
    bindingGlobals: defaultOptions.global,
    bindingStringPreparsers: [functionRewrite]
  }
})

// @ts-ignore: Build-Parameter
const version = BUILD_VERSION
export default builder.create({
  version,
  components,
  Component: components.ComponentABC,
  expressionRewriting
})
