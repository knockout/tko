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

    let htmlSrc = '<div data-bind="text: foo"></div>'
    if (element.dataset.html) {
      htmlSrc = element.dataset.html
    } else if (templateNodes) {
      htmlSrc = templateNodes.map(n => {
        return n.outerHTML ?? '\n'
      }).join('')
    }
    this.html = tko.observable(trimSrc(htmlSrc))

    const vmSrc = element.dataset.vm || 'return {"foo": "bar"}'
    this.vm = tko.observable(trimSrc(vmSrc))
  }

  static get element () {
    const root = document.createElement('div')
    root.classList.add('demo-panel')
    root.innerHTML = `
      <textarea class="html" data-bind="textInput: html"></textarea>
      <textarea class="vm" data-bind="textInput: vm"></textarea>
      <div class="render" data-bind="htmlWithBindings: {html: html, vm: vm}"></div>
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
            const vm = (new Function(this.vm())).call()
            const root = document.createElement('div')
            root.innerHTML = this.html()
            element.replaceChildren(root)
            tko.applyBindings(vm, root)
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
