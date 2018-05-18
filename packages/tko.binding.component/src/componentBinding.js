//
// Binding Handler for Components
//

import {
    virtualElements, makeArray, cloneNodes
} from 'tko.utils'

import {
    unwrap
} from 'tko.observable'

import {
    applyBindingsToDescendants, AsyncBindingHandler
} from 'tko.bind'

import {LifeCycle} from 'tko.lifecycle'

import registry from 'tko.utils.component'

var componentLoadingOperationUniqueId = 0

export default class ComponentBinding extends AsyncBindingHandler {
  constructor (params) {
    super(params)
    this.originalChildNodes = makeArray(
      virtualElements.childNodes(this.$element)
    )
    this.computed('computeApplyComponent')
  }

  cloneTemplateIntoElement (componentName, componentDefinition, element) {
    const template = componentDefinition['template']
    if (!template) {
      throw new Error('Component \'' + componentName + '\' has no template')
    }
    const clonedNodesArray = cloneNodes(template)
    virtualElements.setDomNodeChildren(element, clonedNodesArray)
  }

  createViewModel (componentDefinition, element, originalChildNodes, componentParams) {
    const componentViewModelFactory = componentDefinition.createViewModel
    return componentViewModelFactory
      ? componentViewModelFactory.call(componentDefinition, componentParams, { 'element': element, 'templateNodes': originalChildNodes })
      : componentParams // Template-only component
  }

  computeApplyComponent () {
    const value = unwrap(this.value)
    let componentName
    let componentParams

    if (typeof value === 'string') {
      componentName = value
    } else {
      componentName = unwrap(value['name'])
      componentParams = unwrap(value['params'])
    }

    this.latestComponentName = componentName

    if (!componentName) {
      throw new Error('No component name specified')
    }

    this.loadingOperationId = this.currentLoadingOperationId = ++componentLoadingOperationUniqueId
    registry.get(componentName, (defn) => this.applyComponentDefinition(componentName, componentParams, defn))
  }

  applyComponentDefinition (componentName, componentParams, componentDefinition) {
    // If this is not the current load operation for this element, ignore it.
    if (this.currentLoadingOperationId !== this.loadingOperationId ||
        this.latestComponentName !== componentName) { return }

    // Clean up previous state
    this.cleanUpState()

    const element = this.$element

    // Instantiate and bind new component. Implicitly this cleans any old DOM nodes.
    if (!componentDefinition) {
      throw new Error('Unknown component \'' + componentName + '\'')
    }
    this.cloneTemplateIntoElement(componentName, componentDefinition, element)

    const componentViewModel = this.createViewModel(componentDefinition, element, this.originalChildNodes, componentParams)

    if (componentViewModel instanceof LifeCycle) {
      componentViewModel.anchorTo(this.$element)
    }

    const ctxExtender = (ctx) => Object.assign(ctx, {
      $component: componentViewModel,
      $componentTemplateNodes: this.originalChildNodes
    })

    const childBindingContext = this.$context.createChildContext(componentViewModel, /* dataItemAlias */ undefined, ctxExtender)
    this.currentViewModel = componentViewModel

    const bindingResult = applyBindingsToDescendants(childBindingContext, this.$element)
    if (bindingResult.isSync) {
      this.onApplicationComplete(componentViewModel, bindingResult)
    } else {
      bindingResult.completionPromise
        .then(() => this.onApplicationComplete(componentViewModel, bindingResult))
    }
  }

  onApplicationComplete (componentViewModel, bindingResult) {
    if (componentViewModel && componentViewModel.koDescendantsComplete) {
      componentViewModel.koDescendantsComplete(this.$element)
    }
    this.completeBinding(bindingResult)
  }

  cleanUpState () {
    const currentView = this.currentViewModel
    const currentViewDispose = currentView && currentView.dispose
    if (typeof currentViewDispose === 'function') {
      currentViewDispose.call(currentView)
    }
    this.currentViewModel = null
    // Any in-flight loading operation is no longer relevant, so make sure we ignore its completion
    this.currentLoadingOperationId = null
  }

  dispose () {
    this.cleanUpState()
    super.dispose()
  }

  get controlsDescendants () { return true }
  static get allowVirtualElements () { return true }
}
