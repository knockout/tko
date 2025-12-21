import { ieVersion, stringStartsWith, safeSetTimeout, tagNameLower, arrayForEach, selectExtensions } from '@tko/utils'

import { unwrap, dependencyDetection } from '@tko/observable'

import { applyBindingAccessorsToNode, BindingHandler } from '@tko/bind'

export class value extends BindingHandler {
  static get after() {
    return ['options', 'foreach', 'template']
  }

  $element: HTMLInputElement
  elementValueBeforeEvent: any
  propertyChangeFired: any
  propertyChangedFired: boolean
  updateFromModel: any
  constructor(...args: [any]) {
    super(...args)

    // If the value binding is placed on a radio/checkbox, then just pass through to checkedValue and quit
    if (this.isCheckboxOrRadio) {
      applyBindingAccessorsToNode(this.$element, { checkedValue: this.valueAccessor })
      return
    }

    this.propertyChangedFired = false
    this.elementValueBeforeEvent = null

    if (this.ieAutoCompleteHackNeeded) {
      this.addEventListener('propertyChange', () => (this.propertyChangedFired = true))
      this.addEventListener('focus', () => (this.propertyChangedFired = false))
      this.addEventListener('blur', () => this.propertyChangeFired && this.valueUpdateHandler())
    }

    arrayForEach(this.eventsToCatch, eventName => this.registerEvent(eventName))

    if (this.isInput && this.$element.type === 'file') {
      this.updateFromModel = this.updateFromModelForFile
    } else {
      this.updateFromModel = this.updateFromModelForValue
    }

    this.computed('updateFromModel')
  }

  get eventsToCatch() {
    const requestedEventsToCatch = this.allBindings.get('valueUpdate')
    const requestedEventsArray =
      typeof requestedEventsToCatch === 'string' ? [requestedEventsToCatch] : requestedEventsToCatch || []
    return [...new Set(['change', ...requestedEventsArray])]
  }

  get isInput() {
    return tagNameLower(this.$element) === 'input'
  }

  get isCheckboxOrRadio() {
    const e = this.$element
    return this.isInput && (e.type == 'checkbox' || e.type == 'radio')
  }

  // Workaround for https://github.com/SteveSanderson/knockout/issues/122
  // IE doesn't fire "change" events on textboxes if the user selects a value from its autocomplete list
  get ieAutoCompleteHackNeeded() {
    return (
      ieVersion
      && this.isInput
      && this.$element.type == 'text'
      && this.$element.autocomplete != 'off'
      && (!this.$element.form || this.$element.form.autocomplete != 'off')
    )
  }

  valueUpdateHandler() {
    this.elementValueBeforeEvent = null
    this.propertyChangedFired = false
    this.value = selectExtensions.readValue(this.$element)
  }

  registerEvent(eventName) {
    // The syntax "after<eventname>" means "run the handler asynchronously after the event"
    // This is useful, for example, to catch "keydown" events after the browser has updated the control
    // (otherwise, selectExtensions.readValue(this) will receive the control's value *before* the key event)
    let handler = this.valueUpdateHandler.bind(this)
    if (stringStartsWith(eventName, 'after')) {
      handler = () => {
        // The elementValueBeforeEvent variable is non-null *only* during the brief gap between
        // a keyX event firing and the valueUpdateHandler running, which is scheduled to happen
        // at the earliest asynchronous opportunity. We store this temporary information so that
        // if, between keyX and valueUpdateHandler, the underlying model value changes separately,
        // we can overwrite that model value change with the value the user just typed. Otherwise,
        // techniques like rateLimit can trigger model changes at critical moments that will
        // override the user's inputs, causing keystrokes to be lost.
        this.elementValueBeforeEvent = selectExtensions.readValue(this.$element)
        safeSetTimeout(this.valueUpdateHandler.bind(this), 0)
      }
      eventName = eventName.substring(5 /* 'after'.length */)
    }
    this.addEventListener(eventName, handler)
  }

  updateFromModelForFile() {
    // For file input elements, can only write the empty string
    const newValue = unwrap(this.value)
    if (newValue === null || newValue === undefined || newValue === '') {
      this.$element.value = ''
    } else {
      dependencyDetection.ignore(this.valueUpdateHandler, this) // reset the model to match the element
    }
  }

  updateFromModelForValue() {
    const element = this.$element
    const newValue = unwrap(this.value)
    const elementValue = selectExtensions.readValue(element)

    if (this.elementValueBeforeEvent !== null && newValue === this.elementValueBeforeEvent) {
      safeSetTimeout(this.updateFromModel.bind(this), 0)
      return
    }

    if (newValue === elementValue && elementValue !== undefined) {
      return
    }

    if (tagNameLower(element) === 'select') {
      const allowUnset = this.allBindings.get('valueAllowUnset')
      selectExtensions.writeValue(element, newValue, allowUnset)

      if (!allowUnset && newValue !== selectExtensions.readValue(element)) {
        // If you try to set a model value that can't be represented in an already-populated dropdown, reject that change,
        // because you're not allowed to have a model value that disagrees with a visible UI selection.
        dependencyDetection.ignore(this.valueUpdateHandler, this)
      }
    } else {
      selectExtensions.writeValue(element, newValue)
    }
  }
}
