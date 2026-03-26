/**
 * Expressive Code plugin: adds an "Open in Playground" button to HTML code blocks.
 *
 * The button sits inside the .copy toolbar next to the built-in copy button.
 * It encodes the block's HTML and JS into a URL hash that /playground reads.
 *
 * Replicates the exact same DOM structure and CSS as the built-in copy button:
 *   <a class="playground-open"><div></div></a>
 *   - element: size, position, transition, opacity
 *   - div: background layer with idle opacity
 *   - ::before: border layer
 *   - ::after: icon via CSS mask-image
 */

const MASK_SVG = `url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%20fill%3D'none'%20stroke%3D'black'%20stroke-width%3D'1.75'%3E%3Cpath%20d%3D'M15%203h6v6'%2F%3E%3Cpath%20d%3D'M10%2014%2021%203'%2F%3E%3Cpath%20d%3D'M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'%2F%3E%3C%2Fsvg%3E")`

function h(tag, props, children = []) {
  return {
    type: 'element',
    tagName: tag,
    properties: props,
    children: Array.isArray(children) ? children : [children]
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
      /* Element — mirrors .copy button */
      .playground-open {
        position: relative;
        align-self: flex-end;
        margin: 0;
        padding: 0;
        border: none;
        border-radius: 0.2rem;
        z-index: 1;
        cursor: pointer;
        transition-property: opacity, background, border-color;
        transition-duration: 0.2s;
        transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
        width: 2rem;
        height: 2rem;
        background: var(--code-background);
        opacity: 0;
        text-decoration: none;
        display: block;
      }

      /* Inner div — background layer, mirrors .copy button div */
      .playground-open div {
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: var(--ec-frm-inlBtnBg);
        opacity: var(--ec-frm-inlBtnBgIdleOpa);
        transition-property: inherit;
        transition-duration: inherit;
        transition-timing-function: inherit;
      }

      /* Border layer — mirrors .copy button::before */
      .playground-open::before {
        content: '';
        position: absolute;
        pointer-events: none;
        inset: 0;
        border-radius: inherit;
        border: var(--ec-brdWd) solid var(--ec-frm-inlBtnBrd);
        opacity: var(--ec-frm-inlBtnBrdOpa);
      }

      /* Icon layer — mirrors .copy button::after */
      .playground-open::after {
        content: '';
        position: absolute;
        pointer-events: none;
        inset: 0;
        background-color: var(--ec-frm-inlBtnFg);
        -webkit-mask-image: ${MASK_SVG};
        -webkit-mask-repeat: no-repeat;
        mask-image: ${MASK_SVG};
        mask-repeat: no-repeat;
        margin: 0.475rem;
        line-height: 0;
      }

      /* Show on frame hover — mirrors .frame:hover .copy button */
      .frame:hover .playground-open,
      .playground-open:focus-visible {
        opacity: 0.75;
      }

      /* Direct hover — mirrors .copy button:hover */
      .playground-open:hover,
      .playground-open:focus:focus-visible {
        opacity: 1;
      }
      .playground-open:hover div,
      .playground-open:focus:focus-visible div {
        opacity: var(--ec-frm-inlBtnBgHoverOrFocusOpa);
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

        const copyDiv = findNode(ast, n =>
          n.type === 'element' &&
          n.tagName === 'div' &&
          Array.isArray(n.properties?.className) &&
          n.properties.className.includes('copy')
        )
        if (!copyDiv) return

        // Match the copy button's DOM: <a><div></div></a>
        const bgDiv = h('div', {})
        const link = h('a', {
          className: ['playground-open'],
          href: `/playground#${hash}`,
          target: '_blank',
          title: 'Open in Playground'
        }, [bgDiv])

        copyDiv.children.unshift(link)
      }
    }
  }
}
