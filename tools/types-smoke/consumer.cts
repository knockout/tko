import ko = require('@tko/build.knockout')
import reference = require('@tko/build.reference')
import observablePkg = require('@tko/observable')
import computedPkg = require('@tko/computed')
import bindingCorePkg = require('@tko/binding.core')
import providerDataBindPkg = require('@tko/provider.databind')
import providerPkg = require('@tko/provider')
import utilsPkg = require('@tko/utils')

const name = observablePkg.observable('TKO')
const knockoutVersion: string = ko.version
const referenceVersion: string = reference.version
const bindingString: string = ko.expressionRewriting.preProcessBindings('text: name')
const jsxTree = reference.jsx.createElement('div', null, name)
const rendered = reference.jsx.render(jsxTree)

rendered.dispose()

const doubled = computedPkg.computed(() => 2 * 2)
const doubledValue: number = doubled()

const coreBindingCount: number = Object.keys(bindingCorePkg.bindings).length
const _hasTextBinding: boolean = 'text' in bindingCorePkg.bindings

const dbProvider = new providerDataBindPkg.DataBindProvider()
const _asProvider: InstanceType<typeof providerPkg.Provider> = dbProvider

const parsed: number | null = utilsPkg.parseJson<number>('42')
if (parsed !== null) {
  const _narrowed: number = parsed
}

export = {
  bindingString,
  knockoutVersion,
  referenceVersion,
  doubledValue,
  coreBindingCount,
  dbProvider,
  parsed
}
