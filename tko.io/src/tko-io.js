const {ko} = window

const GITHUB_ROOT = 'https://github.com/knockout/tko/blob/master/packages/'
const TITLE_QS = '.section-title, h1, h2'

const titleNodeMap = new Map()

ko.options.deferUpdates = true

const titleObserver = new IntersectionObserver(entries => {
  entries.forEach(e => titleNodeMap.get(e.target)(e.isIntersecting))
})


class Title {
  constructor ({element, navIdNumber}) {
    const navId = `toc-${navIdNumber}`
    const depth = this.getDepth(element)
    Object.assign(this, {element, navId, depth})
    element.setAttribute('id', this.navId)

    const viewportObservables = ko.observableArray([])

    for (const node of this.generateSiblingNodes()) {
      const nodeInViewport = ko.observable(false)
      if (titleNodeMap.has(node)) {
        viewportObservables.push(titleNodeMap.get(node))
      } else {
        titleNodeMap.set(node, nodeInViewport)
        titleObserver.observe(node)
      }
      viewportObservables.push(nodeInViewport)
    }

    this.inViewport = ko.computed(() => viewportObservables().some(o => o()))
  }

  * generateSiblingNodes () {
    let atNode = this.element
    yield atNode
    while (atNode = atNode.nextSibling) {
      if (atNode.nodeType !== atNode.ELEMENT_NODE) { continue }
      if (this.getDepth(atNode) <= this.depth) { return }
      yield atNode
    }
  }

  getDepth (node) {
    if (node.classList.contains('section-title')) { return 0 }
    if (node.tagName === 'H1') { return 1 }
    if (node.tagName === 'H2') { return 2 }
    return 3
  }

  get css () {
    const css = { 'in-viewport': this.inViewport }
    switch (this.element.tagName) {
      case 'DIV': Object.assign(css, { section: true }); break
      case 'H2': Object.assign(css, { subheading: true }); break
      case 'H1': Object.assign(css, { heading: true }); break
    }
    return css
  }

  get nodes () {
    const node = document.createElement('span')
    node.innerHTML = this.element.innerHTML
    return [node]
  }

  click (vm, evt) {
    this.element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return false
  }
}

function * generateTitles () {
  let navIdNumber = 0
  for (const element of document.querySelectorAll(TITLE_QS)) {
    navIdNumber++
    yield new Title({element, navIdNumber})
  }
}


/**
 * Rely on some convention to map the source file to its parts / github origin.
 */
ko.bindingHandlers.set({
  source (element) {
    const origin = this.value // e.g. "../packages/tko/docs/intro.md"
    const link = GITHUB_ROOT + origin
    const [pkg, file] = origin.split('/docs/')

    element.classList.add('source')
    element.setAttribute('title', `This part of the documentation comes from ${origin} on GitHub/knockout/tko`)
    element.innerHTML =
      `<a href='${link}'>
        <i class='fa fa-fw fa-github'></i>
        ${pkg}
        <i class='fa fa-fw fa-angle-right'></i>
        ${file}
      </a>`
  },

  highlightIfCurrent (element) {
    for (const anchor of element.querySelectorAll('a[href]')) {
      if (anchor.href === location.href) {
        anchor.classList.add('current-page')
      }
    }
  }
})

window.addEventListener("load", () => {
  const contents = ko.observableArray(Array.from(generateTitles()))
  ko.applyBindings({ contents })
})
