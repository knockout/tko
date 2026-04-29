//
// Binding Handler for Components
//

import { virtualElements, makeArray, cloneNodes } from '@tko/utils'

import { unwrap } from '@tko/observable'

import { DescendantBindingHandler } from '@tko/bind'

import { JsxObserver, maybeJsx } from '@tko/utils.jsx'

import { NativeProvider } from '@tko/provider.native'

import { LifeCycle } from '@tko/lifecycle'

import registry from '@tko/utils.component'

import type { BindingContext } from '@tko/bind'

let componentLoadingOperationUniqueId = 0

export default class ComponentBinding extends DescendantBindingHandler {
  childBindingContext: BindingContext
  currentLoadingOperationId: number | null
  currentViewModel: any
  latestComponentName: string
  loadingOperationId: number
  originalChildNodes: Node[]
  constructor(params: any) {
    super(params)
    this.originalChildNodes = makeArray(virtualElements.childNodes(this.$element as Node))
    this.computed('computeApplyComponent')
  }

  /**
   * Look up a <template id="$componentName"> (or any element with that id)
   * in the document and return its child nodes as a template node array,
   * or null if none is found. Used as a fallback when no config/viewModel
   * template and no instance children are provided.
   */
  findSharedTemplate(componentName: string): Node[] | null {
    if (typeof document === 'undefined') return null
    const el = document.getElementById(componentName)
    if (!el) return null
    const source = el instanceof HTMLTemplateElement ? el.content.childNodes : el.childNodes
    return makeArray(source)
  }

  /**
   * True when originalChildNodes contain at least one element or a text
   * node with non-whitespace content. Whitespace-only children are treated
   * as "no children" so `<my-comp>   </my-comp>` still errors.
   */
  hasMeaningfulChildren(): boolean {
    const nodes = this.originalChildNodes
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]
      if (n.nodeType === Node.ELEMENT_NODE) return true
      if (n.nodeType === Node.TEXT_NODE && (n.nodeValue ?? '').trim().length > 0) return true
    }
    return false
  }

  cloneTemplateIntoElement(componentName: string, template: any, element: Node) {
    if (!template) {
      throw new Error("Component '" + componentName + "' has no template")
    }

    if (maybeJsx(template)) {
      virtualElements.emptyNode(element)
      this.addDisposable(new JsxObserver(template, element, null, undefined, true))
    } else {
      const clonedNodesArray = cloneNodes(template)
      virtualElements.setDomNodeChildren(element, clonedNodesArray)
    }
  }

  createViewModel(componentDefinition: any, element: Node, originalChildNodes: Node[], componentParams: any) {
    const componentViewModelFactory = componentDefinition.createViewModel
    return componentViewModelFactory
      ? componentViewModelFactory.call(componentDefinition, componentParams, {
          element,
          templateNodes: originalChildNodes
        })
      : componentParams // Template-only component
  }

  /**
   * Return the $componentTemplateSlotNodes for the given template
   * @param {HTMLElement|jsx} template
   */
  makeTemplateSlotNodes(originalChildNodes: HTMLElement[]) {
    return Object.assign({}, ...this.genSlotsByName(originalChildNodes))
  }

  /**
   * Iterate over the templateNodes, yielding each '<element slot=name>'
   * as an object * of {name: element}.
   * @param {HTMLElement[]} templateNodes
   */
  *genSlotsByName(templateNodes: HTMLElement[]): Generator<{ [key: string]: HTMLElement }, void, unknown> {
    for (const node of templateNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        continue
      }
      const slotName = node.getAttribute('slot')
      if (!slotName) {
        continue
      }
      yield { [slotName]: node }
    }
  }

  computeApplyComponent() {
    const value = unwrap(this.value)
    let componentName: string
    let componentParams: any

    if (typeof value === 'string') {
      componentName = value
    } else {
      componentName = unwrap(value.name)
      componentParams = NativeProvider.getNodeValues(this.$element) || unwrap(value.params)
    }

    this.latestComponentName = componentName

    if (!componentName) {
      throw new Error('No component name specified')
    }

    this.loadingOperationId = this.currentLoadingOperationId = ++componentLoadingOperationUniqueId
    registry.get(componentName, (defn: any) => this.applyComponentDefinition(componentName, componentParams, defn))
  }

  makeChildBindingContext($component: any): any {
    const ctxExtender = (ctx: any) =>
      Object.assign(ctx, {
        $component,
        $componentTemplateNodes: this.originalChildNodes,
        $componentTemplateSlotNodes: this.makeTemplateSlotNodes(this.originalChildNodes as HTMLElement[])
      })

    return this.$context.createChildContext($component, undefined, ctxExtender)
  }

  applyComponentDefinition(componentName: string, componentParams: any, componentDefinition: any) {
    // If this is not the current load operation for this element, ignore it.
    if (this.currentLoadingOperationId !== this.loadingOperationId || this.latestComponentName !== componentName) {
      return
    }

    // Clean up previous state
    this.cleanUpState()

    const element = this.$element

    // Instantiate and bind new component. Implicitly this cleans any old DOM nodes.
    if (!componentDefinition) {
      throw new Error("Unknown component '" + componentName + "'")
    }

    if (componentDefinition.template) {
      this.cloneTemplateIntoElement(componentName, componentDefinition.template, element)
    }

    const componentViewModel = this.createViewModel(
      componentDefinition,
      element,
      this.originalChildNodes,
      componentParams
    )

    this.childBindingContext = this.makeChildBindingContext(componentViewModel)

    const viewTemplate = componentViewModel && componentViewModel.template

    if (!componentDefinition.template) {
      if (viewTemplate) {
        this.cloneTemplateIntoElement(componentName, viewTemplate, element)
      } else if (this.hasMeaningfulChildren()) {
        this.cloneTemplateIntoElement(componentName, this.originalChildNodes, element)
      } else {
        const sharedTemplate = this.findSharedTemplate(componentName)
        if (sharedTemplate) {
          this.cloneTemplateIntoElement(componentName, sharedTemplate, element)
        } else {
          throw new Error("Component '" + componentName + "' has no template")
        }
      }
    }

    if (componentViewModel instanceof LifeCycle) {
      componentViewModel.anchorTo(this.$element)
    }

    this.currentViewModel = componentViewModel

    const onBinding = this.onBindingComplete.bind(this, componentViewModel)
    this.applyBindingsToDescendants(this.childBindingContext, onBinding)
  }

  onBindingComplete(componentViewModel, bindingResult) {
    if (componentViewModel && componentViewModel.koDescendantsComplete) {
      componentViewModel.koDescendantsComplete(this.$element)
    }
    this.completeBinding(bindingResult)
  }

  cleanUpState() {
    const currentView = this.currentViewModel
    const currentViewDispose = currentView && currentView.dispose
    if (typeof currentViewDispose === 'function') {
      currentViewDispose.call(currentView)
    }
    this.currentViewModel = null
    // Any in-flight loading operation is no longer relevant, so make sure we ignore its completion
    this.currentLoadingOperationId = null
  }

  override dispose() {
    this.cleanUpState()
    super.dispose()
  }

  override get controlsDescendants() {
    return true
  }
  static override get allowVirtualElements() {
    return true
  }
}
