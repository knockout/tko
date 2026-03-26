/**
 * Remark plugin: wraps HTML code blocks containing data-bind attributes
 * in synced TSX/HTML tab pairs using Starlight's tab markup.
 *
 * Generates a TSX equivalent by converting data-bind="..." to ko-* attributes,
 * then wraps both versions in <starlight-tabs> for a tabbed display.
 */

/**
 * Parse a KO binding string into individual {name, value} pairs.
 * Respects nested braces, parens, brackets, and quoted strings so that
 * object/array values and string literals are not split on internal commas.
 */
function parseBindingString(str) {
  const bindings = []
  let depth = 0
  let start = 0
  let quote = null

  for (let i = 0; i <= str.length; i++) {
    const ch = i < str.length ? str[i] : null

    if (quote) {
      if (ch === '\\') { i++; continue }
      if (ch === quote) quote = null
      continue
    }

    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue }
    if (ch === '{' || ch === '(' || ch === '[') depth++
    else if (ch === '}' || ch === ')' || ch === ']') depth--
    else if ((ch === ',' || i === str.length) && depth === 0) {
      const part = str.slice(start, i).trim()
      if (part) {
        const colon = part.indexOf(':')
        if (colon > 0) {
          bindings.push({
            name: part.slice(0, colon).trim(),
            value: part.slice(colon + 1).trim()
          })
        }
      }
      start = i + 1
    }
  }

  return bindings
}

/**
 * Convert HTML with data-bind attributes to TSX with ko-* attributes.
 */
function convertDataBindToTsx(html) {
  return html.replace(/data-bind=(["'])([\s\S]*?)\1/g, (_match, _quote, bindingStr) => {
    const bindings = parseBindingString(bindingStr)
    if (bindings.length === 0) return _match
    return bindings.map(({ name, value }) => `ko-${name}={${value}}`).join(' ')
  })
}

/**
 * Build the array of AST nodes that replace a single HTML code block:
 *   html(open tabs + tablist + open TSX panel)
 *   code(tsx)
 *   html(close TSX panel + open HTML panel)
 *   code(html)
 *   html(close HTML panel + restore + close tabs)
 */
function createTabGroup(node, id) {
  const tsxCode = convertDataBindToTsx(node.value)
  const tsxId = `${id}t`
  const htmlId = `${id}h`

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
      value: tsxCode,
      meta: node.meta
    },
    {
      type: 'html',
      value: `</div><div role="tabpanel" id="tab-panel-${htmlId}" aria-labelledby="tab-${htmlId}" hidden>`
    },
    {
      type: 'code',
      lang: 'html',
      value: node.value,
      meta: node.meta
    },
    {
      type: 'html',
      value: `</div><starlight-tabs-restore></starlight-tabs-restore></starlight-tabs>`
    }
  ]
}

function walkAndTransform(node, counter) {
  if (!Array.isArray(node.children)) return

  const newChildren = []
  for (const child of node.children) {
    if (
      child.type === 'code' &&
      child.lang === 'html' &&
      /data-bind=/.test(child.value)
    ) {
      newChildren.push(...createTabGroup(child, ++counter.value))
    } else {
      walkAndTransform(child, counter)
      newChildren.push(child)
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
