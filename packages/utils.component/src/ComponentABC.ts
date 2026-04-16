/**
 * Component --- Abstract Base Class
 *
 * This simplifies and compartmentalizes Components.  Use this:
 *
 *    class CompX extends ComponentABC {
 *    	static get element () { return 'comp-x-id' }
 *    	static get sync () { return false }
 *    	static get elementName () { return 'comp-x' }
 *    }
 *    CompX.register()
 *
 * instead of:
 *
 *   class CompX {}
 *
 *   ko.components.register('comp-x', {
 *     viewModel: CompX,
 *     synchronous: false,
 *     template: { element: 'comp-x' }
 *   })
 *
 * As well, gain all the benefits of a LifeCycle, namely automated
 * event and subscription addition/removal.
 *
 * NOTE: A Component created this way can add events to the component node
 * with `this.addEventListener(type, action)`.
 */
import { LifeCycle } from '@tko/lifecycle'
import { register, VIEW_MODEL_FACTORY } from './loaders'

export class ComponentABC extends LifeCycle {
  /**
   * The tag name of the custom element.  For example 'my-component'.
   * By default converts the class name from camel case to kebab case.
   * @return {string} The custom node name of this component.
   */
  static get customElementName() {
    return this.name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
  }

  /**
   * Overload this to return:
   * 1. A string of markup
   * 2. An array of DOM nodes
   * 3. A document fragment
   * 4. An AMD module (with `{require: 'some/template'}`)
   * If neither this nor `element` is overloaded, ComponentABC looks up a
   * <template id="$customElementName"> in the document. If that's also
   * absent, the component's own instance children serve as its template
   * (children-as-template mode).
   * @return {mixed} One of the accepted template types for the ComponentBinding.
   */
  static get template(): any {
    if ('template' in this.prototype) {
      return undefined
    }
    const element = this.element
    if (element) {
      return { element }
    }
    const autoElement = typeof document !== 'undefined' ? document.getElementById(this.customElementName) : null
    return autoElement ? { element: autoElement } : undefined
  }

  /**
   * Overload this to return:
   * 1. The element ID
   * 2. A DOM node itself
   * Leave unset to use children-as-template mode — the component's own
   * instance children become its template.
   * @return {string|HTMLElement|undefined} the element ID, actual element,
   *   or undefined to opt into children-as-template.
   */
  static get element(): string | HTMLElement | undefined {
    return undefined
  }

  /**
   * @return {bool} True if the component shall load synchronously
   */
  static get sync() {
    return true
  }

  /**
   * Construct a new instance of the model.  When using ComponentABC as a
   * base class, we do pass in the $element and $componentTemplateNodes.
   * @param {Object} params
   * @param {{element: HTMLElement, templateNodes: [HTMLElement]}} componentInfo
   */
  static [VIEW_MODEL_FACTORY](params: object, componentInfo: ComponentInfo): ComponentABC {
    return new (this as any)(params, componentInfo)
  }

  static register(name = this.customElementName) {
    // biome-ignore lint/complexity/noUselessThisAlias: viewModel captures the subclass for register()
    const viewModel = this
    const { template } = this
    const synchronous = this.sync
    register(name, { viewModel, template, synchronous })
  }
}
interface ComponentInfo {
  element: HTMLElement
  templateNodes: HTMLElement[]
}
