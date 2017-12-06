const {$, ko} = window

const githubRoot = 'https://github.com/knockout/tko/blob/master/packages/'

const contents = ko.observableArray()
let navIdNumber = 1

function addContent (i, documentNode) {
  const docTag = documentNode.tagName
  const tocNode = document.createElement('span')
  tocNode.innerHTML = documentNode.innerHTML
  const navId = `toc-${navIdNumber++}`
  documentNode.setAttribute('id', navId)
  const css = docTag === 'H1' ? { nav: true, 'flex-column': true } : {}
  contents.push({ nodes: [tocNode], navId, css })
}

/**
 * Rely on some convention to map the source file to its parts / github origin.
 */
ko.bindingHandlers.set({
  source (element) {
    const origin = this.value // e.g. "../packages/tko/docs/intro.md"
    const link = githubRoot + origin
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
  }
})

$(() => {
  $('.section-title, h1').each(addContent)
  ko.applyBindings({ contents })
})
