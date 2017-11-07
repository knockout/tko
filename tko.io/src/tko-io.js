const {$, ko} = window

const contents = ko.observableArray()
let navIdNumber = 1

class TableOfContents {
  constructor () {
    this.contents = contents
  }
}

function addContent (i, documentNode) {
  const docTag = documentNode.tagName
  const tocNode = document.createElement('span')
  tocNode.innerHTML = documentNode.innerHTML
  const navId = `toc-${navIdNumber++}`
  documentNode.setAttribute('id', navId)
  const css = docTag === 'H1' ? { nav: true, 'flex-column': true }
    : docTag === 'H2' ? { nav: true, 'flex-column': true, small: true } : {}
  contents.push({ nodes: [tocNode], navId, css })
}

$(() => {
  ko.components.register('table-of-contents', {
    viewModel: TableOfContents,
    template: { element: 'table-of-contents' }
  })

  $('.section-title, h1')
    .each(addContent)

  ko.applyBindings({}, document.getElementById('toc'))
})
