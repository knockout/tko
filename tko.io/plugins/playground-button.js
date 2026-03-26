/**
 * Expressive Code plugin: adds an "Open in Playground" button to HTML code blocks.
 *
 * The button sits inside the .copy toolbar next to the built-in copy button.
 * It encodes the block's HTML and JS into a URL hash that /playground reads.
 */

const ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>`

function h(tag, props, children = []) {
  return {
    type: 'element',
    tagName: tag,
    properties: props,
    children: typeof children === 'string'
      ? [{ type: 'raw', value: children }]
      : children
  }
}

function findNode(node, predicate) {
  if (predicate(node)) return node
  if (node.children) {
    for (const child of node.children) {
      const found = findNode(child, predicate)
      if (found) return found
    }
  }
  return null
}

function splitHtmlAndScript(code) {
  let html = code
  let js = ''
  html = html.replace(/<script\s+src=[^>]*><\/script>\s*/gi, '')
  html = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>\s*/gi, (_, content) => {
    js += content.trim() + '\n'
    return ''
  })
  return { html: html.trim(), js: js.trim() }
}

function encodePlaygroundHash(html, js) {
  const data = JSON.stringify({ html, js })
  return Buffer.from(encodeURIComponent(data)).toString('base64')
}

export function pluginPlaygroundButton() {
  return {
    name: 'playground-button',

    baseStyles: `
      .playground-open {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 0.2rem;
        background: transparent;
        color: var(--ec-frm-inlBtnFg);
        opacity: 0;
        cursor: pointer;
        transition: opacity 0.2s, background 0.2s;
        text-decoration: none;
      }
      .frame:hover .playground-open,
      .playground-open:focus-visible {
        opacity: 0.75;
      }
      .playground-open:hover {
        opacity: 1;
        background: var(--ec-frm-inlBtnBg);
      }
      .playground-open svg {
        width: 1.15em;
        height: 1.15em;
      }
    `,

    hooks: {
      postprocessRenderedBlock: ({ codeBlock, renderData }) => {
        if (codeBlock.language !== 'html') return

        const code = codeBlock.code
        const { html, js } = splitHtmlAndScript(code)
        if (!html && !js) return

        const hash = encodePlaygroundHash(html, js)
        const ast = renderData.blockAst

        // Find the .copy div in the AST
        const copyDiv = findNode(ast, n =>
          n.type === 'element' &&
          n.tagName === 'div' &&
          Array.isArray(n.properties?.className) &&
          n.properties.className.includes('copy')
        )
        if (!copyDiv) return

        const link = h('a', {
          className: ['playground-open'],
          href: `/playground#${hash}`,
          target: '_blank',
          title: 'Open in Playground'
        }, ICON)

        // Insert before the existing copy button elements
        copyDiv.children.unshift(link)
      }
    }
  }
}
