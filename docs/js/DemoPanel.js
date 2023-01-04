function trimSrc (src) {
  const leadingSpaces = src.match(/^( *)\S/m)?.[1]?.length || 0
  if (leadingSpaces) {
    return src.replaceAll(new RegExp(`^ {${leadingSpaces}}`, 'gm'), '').trim()
  } else {
    return src.trim()
  }
}

export class DemoPanel extends tko.Component {
  constructor (_, { element, templateNodes }) {
    super()

    let htmlSrc = ''
    let jsSrc = ''
    for (const n of templateNodes) {
      if (n instanceof HTMLScriptElement) {
        jsSrc = n.text
      } else if (n instanceof Text) {
        htmlSrc += n.data
      } else {
        htmlSrc += n.outerHTML ?? '\n'
      }
    }

    this.html = tko.observable(trimSrc(htmlSrc))
    this.js = tko.observable(trimSrc(jsSrc))
  }

  static get element () {
    const root = document.createElement('div')
    root.classList.add('demo-panel')
    root.innerHTML = `
      <h3 class="html">HTML</h3>
      <h3 class="js">JS</h3>
      <h3 class="Render">Output</h3>
      <textarea class="html" spellcheck="false" data-bind="textInput: html"></textarea>
      <textarea class="js" spellcheck="false" data-bind="textInput: js"></textarea>
      <div class="render" data-bind="htmlWithBindings"></div>
    `
    return root
  }

  /**
   * Return a binding handlers local to this
   * (or falsy if not found).
   */
  getBindingHandler (bindingKey) {
    return {
      htmlWithBindings: (element, valueAccessor) => {
        this.computed(() => {
          try {
            const root = document.createElement('div')
            root.innerHTML = this.html()
            element.replaceChildren(root)
            new Function(this.js()).call()
          } catch (e) {
            element.innerText = e.toString()
          }
        }).extend({ rateLimit: { timeout: 200, method: 'notifyWhenChangesStop' } })
        return {
          controlsDescendantBindings: true
        }
      }
    }[bindingKey]
  }
}

DemoPanel.register()
