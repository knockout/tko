/**
 * Remark plugin: wraps adjacent handwritten TSX + HTML code blocks
 * in synced Starlight tab groups.
 *
 * TSX examples are authored as real standalone `.tsx` files. When a matching
 * HTML example has a following JS block, that JS is rendered inside the HTML
 * tab panel so it does not appear as a separate block below the tab group.
 */
function isJavaScriptLike(node) {
  return node?.type === 'code' && (node.lang === 'javascript' || node.lang === 'js')
}

function encodePlaygroundJs(value) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function appendPlaygroundJsMeta(meta, jsCode) {
  if (!jsCode) return meta
  const parts = [meta, `playground-js=${encodePlaygroundJs(jsCode)}`].filter(Boolean)
  return parts.join(' ')
}

function createTabGroup(tsxNode, htmlNode, jsNode, id) {
  const tsxId = `${id}t`
  const htmlId = `${id}h`
  const htmlPanelChildren = [
    {
      type: 'code',
      lang: 'html',
      value: htmlNode.value,
      meta: appendPlaygroundJsMeta(htmlNode.meta, jsNode?.value)
    }
  ]

  if (jsNode) {
    htmlPanelChildren.push({
      type: 'code',
      lang: jsNode.lang,
      value: jsNode.value,
      meta: jsNode.meta
    })
  }

  return [
    {
      type: 'html',
      value:
        `<starlight-tabs data-sync-key="code-style">` +
        `<div class="tablist-wrapper not-content"><ul role="tablist">` +
        `<li class="tab" role="presentation">` +
        `<a role="tab" href="#tab-panel-${tsxId}" id="tab-${tsxId}" aria-selected="true">TSX</a></li>` +
        `<li class="tab" role="presentation">` +
        `<a role="tab" href="#tab-panel-${htmlId}" id="tab-${htmlId}" aria-selected="false" tabindex="-1">HTML</a></li>` +
        `</ul></div>` +
        `<div role="tabpanel" id="tab-panel-${tsxId}" aria-labelledby="tab-${tsxId}">`
    },
    {
      type: 'code',
      lang: 'tsx',
      value: tsxNode.value,
      meta: tsxNode.meta
    },
    {
      type: 'html',
      value: `</div><div role="tabpanel" id="tab-panel-${htmlId}" aria-labelledby="tab-${htmlId}" hidden>`
    },
    ...htmlPanelChildren,
    {
      type: 'html',
      value: `</div><starlight-tabs-restore></starlight-tabs-restore></starlight-tabs>`
    }
  ]
}

function walkAndTransform(node, counter) {
  if (!Array.isArray(node.children)) return

  const newChildren = []
  let i = 0

  while (i < node.children.length) {
    const child = node.children[i]
    const next = node.children[i + 1]
    const third = node.children[i + 2]

    if (
      child.type === 'code' &&
      child.lang === 'tsx' &&
      next?.type === 'code' &&
      next.lang === 'html'
    ) {
      newChildren.push(...createTabGroup(child, next, isJavaScriptLike(third) ? third : null, ++counter.value))
      i += isJavaScriptLike(third) ? 3 : 2
    } else if (
      child.type === 'code' &&
      child.lang === 'html' &&
      isJavaScriptLike(next)
    ) {
      newChildren.push({
        ...child,
        meta: appendPlaygroundJsMeta(child.meta, next.value)
      })
      i++
    } else {
      walkAndTransform(child, counter)
      newChildren.push(child)
      i++
    }
  }

  node.children = newChildren
}

export default function tsxTabs() {
  return (tree) => {
    const counter = { value: 0 }
    walkAndTransform(tree, counter)
  }
}
