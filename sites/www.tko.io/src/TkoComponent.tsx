import { default as jss, StyleSheet } from 'jss'
import preset from "jss-preset-default"

import { tko } from './tko'

jss.setup(preset())

const JSS = Symbol('Memoized ViewComponent.jss')
const staticStyles: Record<string, StyleSheet> = {}

/**
 * TkoComponent is a Knockout web-component base-class for all view components.
 *
 * It has builtin JSS styles.
 */
export abstract class TkoComponent extends tko.components.ComponentABC {
  private static customElementName: string

  dispose () {
    super.dispose()
    if (this._styles) { jss.removeStyleSheet(this._styles) }
  }

  /**
   * @return {object|null} containing JSS-style classes that are specific to
   * the instance.
   *
   * This offers more dynamic options than `static get css`, but at a
   * substantial performance cost.  Use sparingly.
   */
  get css () { return {} as const }

  /**
   * @return {object} containing JSS-style classes that apply to every
   * instance of this class.
   *
   * This is higher performance than `get css`
   */
   static get css () { return {} as const }

  /**
   * Lazy getter, so subclass constructors can refer to observables and
   * computeds added to the class in the constructor
   * after `super` has been called.
   */
   get styles () : StyleSheet {
    if (!this.css) { return { classes: {} } as StyleSheet }
    const options = {
      meta: `⚙️  Dynamic Classes for ${this.constructor.name}>`,
      link: true,
      classNamePrefix: `${this.constructor.name}--`
    }
    const sheet = jss.createStyleSheet(this.css, options).attach()
    return this._styles || (this._styles = sheet)
  }

  /**
   * Static styles are created for each class (not each instance).
   */
  static get styles () : StyleSheet {
    if (this.name in staticStyles) { return staticStyles[this.name] }
    if (!this.css) { return { classes: {} } as StyleSheet }
    const options = {
      meta: `🎨  Static Classes for ${this.name}`,
      link: true, // Warning: [JSS] Failed to execute 'insertRule' on 'CSSStyleSheet': Failed to insert the rule.
      classNamePrefix: `${this.name}__`
    }
    const sheet = jss.createStyleSheet(this.css, options).attach()
    return (staticStyles[this.name] = sheet)
  }

  /**
   * Return the classes object for our JSS/CSS.
   */
   get jss (): Record<string, string> {
    return this[JSS] || (this[JSS] = {
      ...(this.constructor as typeof TkoComponent).styles.classes,
      ...this.styles.classes,
    })
  }

  /**
   * Called when the component is removed from the DOM.  Must be on the
   * prototype (for performance we don't add a callback for every component).
   */
  disconnectedCallback? (node: HTMLElement): void

  get template () { return Symbol('No template') }

  /**
   * We overload the Register to create a custom element that
   * triggers a `disconnectedCallback`. This is simpler and faster
   * than using MutationObserver to trigger when an element
   * is removed from the DOM.
   */
  static register (name = this.customElementName) {
    const wantsCallback = 'disconnectedCallback' in this.prototype
    if (wantsCallback) { this.defineCustomElementForDisconnectCallback(name) }
    return super.register(name)
  }

  /**
   * Define customElement that triggers a disconnection callback when the
   * element is removed from the DOM.
   */
  private static defineCustomElementForDisconnectCallback (name: string) {
    if (globalThis.customElements) {
      customElements.define(name, class extends HTMLElement {
        disconnectedCallback (this: HTMLElement) {
          const component = tko.dataFor(this.children[0])
          if (component) { component.disconnectedCallback(this) }
        }
      })
    } else if (!globalThis.process) {
      console.warn(`"window.customElements" is not available.  Unable to
      register life-cycle disconnection callback.`)
    }
  }
}
