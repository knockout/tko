/**
 * Expressive Code plugin: adds an "Open in Playground" button to HTML code blocks.
 *
 * The button sits inside the .copy toolbar next to the built-in copy button.
 * It encodes the block's HTML and JS into a URL hash that /playground reads.
 *
 * Uses the same CSS mask-image approach as the built-in copy button for a
 * consistent icon style.
 */

const MASK_SVG = `url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%20fill%3D'none'%20stroke%3D'black'%20stroke-width%3D'1.75'%3E%3Cpath%20d%3D'M15%203h6v6'%2F%3E%3Cpath%20d%3D'M10%2014%2021%203'%2F%3E%3Cpath%20d%3D'M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'%2F%3E%3C%2Fsvg%3E")`

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
        position: relative;
        align-self: flex-end;
        width: 2.5rem;
        height: 2.5rem;
        border: none;
        border-radius: 0.2rem;
        opacity: 0;
        cursor: pointer;
        transition-property: opacity, background, border-color;
        transition-duration: 0.2s;
        transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }
      .playground-open::before {
        content: '';
        position: absolute;
        pointer-events: none;
        inset: 0;
        border-radius: inherit;
        background: var(--ec-frm-inlBtnBg);
        opacity: var(--ec-frm-inlBtnBgIdleOpa);
        transition: inherit;
      }
      .playground-open::after {
        content: '';
        position: absolute;
        pointer-events: none;
        inset: 0;
        background-color: var(--ec-frm-inlBtnFg);
        -webkit-mask-image: ${MASK_SVG};
        mask-image: ${MASK_SVG};
        -webkit-mask-repeat: no-repeat;
        mask-repeat: no-repeat;
        -webkit-mask-size: 1.1rem;
        mask-size: 1.1rem;
        -webkit-mask-position: center;
        mask-position: center;
      }
      .frame:hover .playground-open,
      .playground-open:focus-visible {
        opacity: 0.75;
      }
      .playground-open:hover {
        opacity: 1;
      }
      .playground-open:hover::before {
        opacity: var(--ec-frm-inlBtnBgHvrOpa);
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

        // Empty <a> — icon is rendered via CSS ::after mask, matching the copy button
        const link = h('a', {
          className: ['playground-open'],
          href: `/playground#${hash}`,
          target: '_blank',
          title: 'Open in Playground'
        })

        copyDiv.children.unshift(link)
      }
    }
  }
}
