import ko from '@tko/build.knockout'
import reference from '@tko/build.reference'
import { observable } from '@tko/observable'

const name = observable('TKO')
const knockoutVersion: string = ko.version
const referenceVersion: string = reference.version
const bindingString: string = ko.expressionRewriting.preProcessBindings('text: name')
const jsxTree = reference.jsx.createElement('div', null, name)
const rendered = reference.jsx.render(jsxTree)

rendered.dispose()

export { bindingString, knockoutVersion, referenceVersion }
