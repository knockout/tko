import { safeSetTimeout, options, arrayForEach, domData, registerEventHandler } from '@tko/utils'

import { unwrap } from '@tko/observable'

import { BindingHandler } from '@tko/bind'

let operaVersion, safariVersion, firefoxVersion

/**
 * TextInput binding handler for modern browsers (legacy below).
 * @extends BindingHandler
 */
class TextInput extends BindingHandler {
  get aliases() {
    return 'textinput'
  }

  override $element: HTMLInputElement
  previousElementValue: any
  elementValueBeforeEvent?: ReturnType<typeof setTimeout>
  timeoutHandle?: ReturnType<typeof setTimeout>

  constructor(...args: [any]) {
    super(...args)
    this.previousElementValue = this.$element.value

    if (options.debug && (this.constructor as any)._forceUpdateOn) {
      // Provide a way for tests to specify exactly which events are bound
      arrayForEach((this.constructor as any)._forceUpdateOn, eventName => {
        if (eventName.slice(0, 5) === 'after') {
          this.addEventListener(eventName.slice(5), 'deferUpdateModel')
        } else {
          this.addEventListener(eventName, 'updateModel')
        }
      })
    }

    for (const eventName of this.eventsIndicatingSyncValueChange()) {
      this.addEventListener(eventName, 'updateModel')
    }
    for (const eventName of this.eventsIndicatingDeferValueChange()) {
      this.addEventListener(eventName, 'deferUpdateModel')
    }
    this.computed('updateView')
  }

  eventsIndicatingSyncValueChange() {
    // input: Default, modern handler
    // change: Catch programmatic updates of the value that fire this event.
    // blur: To deal with browsers that don't notify any kind of event for some changes (IE, Safari, etc.)
    return ['input', 'change', 'blur']
  }

  eventsIndicatingDeferValueChange(): any[] {
    return []
  }

  updateModel(event) {
    const element = this.$element
    clearTimeout(this.timeoutHandle)
    this.elementValueBeforeEvent = this.timeoutHandle = undefined
    const elementValue = element.value
    if (this.previousElementValue !== elementValue) {
      // Provide a way for tests to know exactly which event was processed
      if (options.debug && event) {
        ;(element as any)._ko_textInputProcessedEvent = event.type
      }
      this.previousElementValue = elementValue
      this.value = elementValue
    }
  }

  deferUpdateModel(event: any) {
    const element = this.$element
    if (!this.timeoutHandle) {
      // The elementValueBeforeEvent variable is set *only* during the brief gap between an
      // event firing and the updateModel function running. This allows us to ignore model
      // updates that are from the previous state of the element, usually due to techniques
      // such as rateLimit. Such updates, if not ignored, can cause keystrokes to be lost.
      this.elementValueBeforeEvent = element.value as any
      const handler = options.debug ? this.updateModel.bind(this, { type: event.type }) : this.updateModel
      this.timeoutHandle = safeSetTimeout(handler, 4)
    }
  }

  updateView() {
    let modelValue = unwrap(this.value)
    if (modelValue === null || modelValue === undefined) {
      modelValue = ''
    }
    if (this.elementValueBeforeEvent !== undefined && modelValue === this.elementValueBeforeEvent) {
      setTimeout(this.updateView.bind(this), 4)
    } else if (this.$element.value !== modelValue) {
      // Update the element only if the element and model are different. On some browsers, updating the value
      // will move the cursor to the end of the input, which would be bad while the user is typing.
      this.previousElementValue = modelValue // Make sure we ignore events (propertychange) that result from updating the value
      this.$element.value = modelValue
      this.previousElementValue = this.$element.value // In case the browser changes the value (see #2281)
    }
  }
}

// Safari <5 doesn't fire the 'input' event for <textarea> elements (it does fire 'textInput'
// but only when typing). So we'll just catch as much as we can with keydown, cut, and paste.
class TextInputLegacySafari extends TextInput {
  override eventsIndicatingDeferValueChange() {
    return ['keydown', 'paste', 'cut']
  }
}

class TextInputLegacyOpera extends TextInput {
  override eventsIndicatingDeferValueChange(): string[] {
    // Opera 10 doesn't always fire the 'input' event for cut, paste, undo & drop operations.
    // We can try to catch some of those using 'keydown'.
    return ['keydown']
  }
}

class TextInputLegacyFirefox extends TextInput {
  eventsIndicatingValueChange(): string[] {
    return [
      ...super.eventsIndicatingSyncValueChange(),
      // Firefox <= 3.6 doesn't fire the 'input' event when text is filled in through autocomplete
      'DOMAutoComplete',
      // Firefox <=3.5 doesn't fire the 'input' event when text is dropped into the input.
      'dragdrop', // < 3.5
      'drop' // 3.5
    ]
  }
}

const w = options.global // window / global
if (w.navigator) {
  const parseVersion = matches => matches && parseFloat(matches[1])
  const userAgent = w.navigator.userAgent
  const isChrome = userAgent.match(/Chrome\/([^ ]+)/)
  // Detect various browser versions because some old versions don't fully support the 'input' event
  operaVersion = w.opera && w.opera.version && parseInt(w.opera.version())
  safariVersion = parseVersion(userAgent.match(/Version\/([^ ]+) Safari/))
  firefoxVersion = parseVersion(userAgent.match(/Firefox\/([^ ]*)/))
}

export const textInput =
  safariVersion && safariVersion < 5
    ? TextInputLegacySafari
    : operaVersion < 11
      ? TextInputLegacyOpera
      : firefoxVersion && firefoxVersion < 4
        ? TextInputLegacyFirefox
        : TextInput
