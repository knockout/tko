const {$, ko} = window

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

$(() => {
  $('.section-title, h1').each(addContent)
  ko.applyBindings({ contents }, document.getElementById('toc'))
})
