import { Builder } from '@tko/builder'

import { ComponentProvider } from '@tko/provider.component'
import { MultiProvider } from '@tko/provider.multi'
import {
  NativeProvider
} from '@tko/provider.native'

import { bindings as coreBindings } from '@tko/binding.core'
import { bindings as componentBindings } from '@tko/binding.component'

import { filters } from '@tko/filter.punches'

import components from '@tko/utils.component'
import { createElement, Fragment } from '@tko/utils.jsx'


const builder = new Builder({
  filters,
  provider: new MultiProvider({
    providers: [
      new ComponentProvider(),
      new NativeProvider(),
    ]
  }),
  bindings: [
    coreBindings,
    componentBindings,
  ],
  extenders: [],
  options: {},
})

export const tko = builder.create({
  jsx: {
    createElement,
    Fragment,
  },
  components,
  version: 'live',
  Component: components.ComponentABC,
})

Object.assign(window, {
  TF: tko.jsx.createElement,
  TFF: tko.jsx.Fragment,
})

