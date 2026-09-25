import { Builder } from '@tko/builder'

import { VirtualProvider } from '@tko/provider.virtual'
import { DataBindProvider } from '@tko/provider.databind'
import { ComponentProvider } from '@tko/provider.component'
import { AttributeProvider } from '@tko/provider.attr'
import { MultiProvider } from '@tko/provider.multi'
import { TextMustacheProvider, AttributeMustacheProvider } from '@tko/provider.mustache'
import { NativeProvider } from '@tko/provider.native'

import { bindings as coreBindings } from '@tko/binding.core'
import { bindings as templateBindings } from '@tko/binding.template'
import { bindings as ifBindings } from '@tko/binding.if'
import { bindings as foreachBindings } from '@tko/binding.foreach'
import { bindings as componentBindings } from '@tko/binding.component'

import { filters } from '@tko/filter.punches'

import components from '@tko/utils.component'
import { createElement, Fragment, render } from '@tko/utils.jsx'
import type { JsxRenderResult } from '@tko/utils.jsx'

import { options } from '@tko/utils'

declare const BUILD_VERSION: string

/** Use === and !== instead of == and != in binding expressions */
options.strictEquality = true

type ReferenceBuildExtensions = {
  jsx: {
    createElement: typeof createElement
    Fragment: typeof Fragment
    render(jsx: any): JsxRenderResult
  }
  components: typeof components
  version: string
  Component: typeof components.ComponentABC
}

const builder = new Builder({
  filters,
  extenders: {},
  options: {},
  provider: new MultiProvider({
    providers: [
      new ComponentProvider(),
      new NativeProvider(),
      new AttributeMustacheProvider(),
      new TextMustacheProvider(),
      new DataBindProvider(),
      new VirtualProvider(),
      new AttributeProvider()
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

const version = BUILD_VERSION

const referenceBuild: ReferenceBuildExtensions = {
  jsx: {
    createElement,
    Fragment,
    render
  },
  components,
  version,
  Component: components.ComponentABC
}

export default builder.create(referenceBuild)
