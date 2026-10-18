import ko from '@tko/build.knockout'
import reference from '@tko/build.reference'
import { observable } from '@tko/observable'
import { computed } from '@tko/computed'
import type { Computed } from '@tko/computed'
import { bindings } from '@tko/binding.core'
import { DataBindProvider } from '@tko/provider.databind'
import type { Provider } from '@tko/provider'
import { parseJson } from '@tko/utils'

const name = observable('TKO')
const knockoutVersion: string = ko.version
const referenceVersion: string = reference.version
const bindingString: string = ko.expressionRewriting.preProcessBindings('text: name')
const jsxTree = reference.jsx.createElement('div', null, name)
const rendered = reference.jsx.render(jsxTree)

rendered.dispose()

// @tko/computed — Computed<T> is callable and its return type is T
const doubled: Computed<number> = computed(() => 2 * 2)
const doubledValue: number = doubled()

// @ts-expect-error — Computed<number> must not be assignable to Computed<string>
const _notComputedString: Computed<string> = doubled

// @tko/binding.core — built-in bindings map has known keys
const coreBindingCount: number = Object.keys(bindings).length
const _hasTextBinding: boolean = 'text' in bindings

// @tko/provider.databind — DataBindProvider must be assignable to Provider
//   (exercises 3-level inheritance chain through generated .d.ts files)
const dbProvider = new DataBindProvider()
const _asProvider: Provider = dbProvider

// @tko/utils — parseJson<T> returns T | null; null guard narrows to T
const parsed: number | null = parseJson<number>('42')
if (parsed !== null) {
  const _narrowed: number = parsed
}

export { bindingString, knockoutVersion, referenceVersion, doubled, doubledValue, coreBindingCount, dbProvider, parsed }
