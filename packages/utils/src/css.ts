//
// DOM - CSS
//

// See: https://github.com/knockout/knockout/issues/1597
const cssClassNameRegex = /\S+/g

function toggleDomNodeCssClass(node: Element, classNames: string, shouldHaveClass?: boolean): void {
  if (!classNames) {
    return
  }
  const tokens = classNames.match(cssClassNameRegex)
  if (!tokens) {
    return
  }
  const method = shouldHaveClass ? 'add' : 'remove'
  for (const token of tokens) {
    node.classList[method](token)
  }
}

export { toggleDomNodeCssClass }
