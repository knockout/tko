//
// HTML-based manipulation
//
import { makeArray } from '../array'
import { emptyDomNode, moveCleanedNodesToContainerElement } from './manipulation'
import * as virtualElements from './virtualElements'
import options from '../options'

// The canonical way to test that the HTML5 <template> tag is supported
const supportsTemplateTag =
  options.useTemplateTag && options.document && 'content' in options.document.createElement('template')

/** @deprecated HTMLTemplateTag or the jquery-template-function as fallback are enough */
function simpleHtmlParse(html: string, documentContext?: Document): Node[] {
  if (!documentContext) {
    documentContext = document
  }
  const div = documentContext.createElement('div')
  div.innerHTML = html
  return makeArray(div.childNodes)
}

function templateHtmlParse(html: string, documentContext?: Document): Node[] {
  if (!documentContext) {
    documentContext = document
  }
  const template = documentContext.createElement('template') as HTMLTemplateElement
  template.innerHTML = html
  return makeArray(template.content.childNodes)
}

function jQueryHtmlParse(html: string, documentContext?: Document): Node[] {
  const jQuery = options.jQuery

  // jQuery's "parseHTML" function was introduced in jQuery 1.8.0 and is a documented public API.
  if (jQuery) {
    return jQuery.parseHTML(html, documentContext) || [] // Ensure we always return an array and never null
  }

  return []
}

/**
 * parseHtmlFragment converts a string into an array of DOM Nodes.
 * If supported, it uses <template>-tag parsing, falling back on
 * jQuery parsing (if jQuery is present), and finally on a
 * straightforward parser.
 *
 * @param  {string} html            To be parsed.
 * @param  {Document} documentContext That owns the executing code.
 * @return {[Node]}              Parsed DOM Nodes
 */
export function parseHtmlFragment(html: string, documentContext?: Document): Node[] {
  const saferHtml = validateHTMLInput(html)

  // Prefer <template>-tag based HTML parsing.
  if (supportsTemplateTag) return templateHtmlParse(saferHtml, documentContext)

  //TODO: It is always true in modern browsers (higher IE11), so we can theoretically remove jQueryHtmlParse and simpleHtmlParse
  if (options.jQuery) {
    // Benefit from jQuery's on old browsers, where possible
    // NOTE: jQuery's HTML parsing fails on element names like tr-*.
    // See: https://github.com/jquery/jquery/pull/1988
    return jQueryHtmlParse(saferHtml, documentContext)
  }

  return simpleHtmlParse(saferHtml, documentContext)
}

const scriptTagPattern = /<script\b[^>]*>([\s\S]*?)<\/script[^>]*>/i
function validateHTMLInput(html: string): string {
  if (!html) return ''

  if (options.templateSizeLimit > 0 && html.length > options.templateSizeLimit) {
    throw new Error("Template is too long. Please configure the 'templateSizeLimit'")
  }

  if (!options.allowScriptTagsInTemplates && scriptTagPattern.test(html)) {
    throw new Error('Script-tag in template detected.')
  }

  return options.sanitizeHtmlTemplate(html)
}

export function parseHtmlForTemplateNodes(html, documentContext) {
  const nodes = parseHtmlFragment(html, documentContext)
  return (nodes.length && nodes[0].parentElement) || moveCleanedNodesToContainerElement(nodes)
}

/**
 * setHtml empties the node's contents, unwraps the HTML, and
 * sets the node's HTML using jQuery.html or parseHtmlFragment
 *
 * @param {DOMNode} node Node in which HTML needs to be set
 * @param {DOMNode} html HTML to be inserted in node
 * @returns undefined
 */
export function setHtml(node: Node, html: Function | string) {
  emptyDomNode(node)

  // There's few cases where we would want to display a stringified
  // function, so we unwrap it.
  if (typeof html === 'function') {
    html = html()
  }

  if (html !== null && html !== undefined) {
    if (typeof html !== 'string') {
      html = html.toString()
    }

    const jQuery = options.jQuery
    // If the browser supports <template> tags, prefer that, as
    // it obviates all the complex workarounds of jQuery.
    //
    // However, jQuery contains a lot of sophisticated code to parse arbitrary HTML fragments,
    // for example <tr> elements which are not normally allowed to exist on their own.
    // If you've referenced jQuery (and template tags are not supported) we'll use that rather than duplicating its code.
    if (jQuery && !supportsTemplateTag) {
      const saferHtml = validateHTMLInput(html)
      jQuery(node).html(saferHtml)
    } else {
      // ... otherwise, use KO's own parsing logic.
      let parsedNodes: Node[]
      if (node.ownerDocument) {
        parsedNodes = parseHtmlFragment(html, node.ownerDocument)
      } else {
        parsedNodes = parseHtmlFragment(html)
      }

      if (node.nodeType === Node.COMMENT_NODE) {
        if (html === null) {
          virtualElements.emptyNode(node)
        } else {
          virtualElements.setDomNodeChildren(node, parsedNodes)
        }
      } else {
        for (let i = 0; i < parsedNodes.length; i++) {
          node.appendChild(parsedNodes[i])
        }
      }
    }
  }
}

//TODO May be MaybeSubscribable<string> -> I actually don't want the dependency
type TextContent = string | null | undefined | Function
export function setTextContent(element: Node, textContent?: TextContent): void {
  let value = typeof textContent === 'function' ? (textContent as Function)() : textContent
  if (value === null || value === undefined) {
    value = ''
  }

  // We need there to be exactly one child: a text node.
  // If there are no children, more than one, or if it's not a text node,
  // we'll clear everything and create a single text node.
  const innerTextNode = virtualElements.firstChild(element)
  if (!innerTextNode || innerTextNode.nodeType !== Node.TEXT_NODE || virtualElements.nextSibling(innerTextNode)) {
    virtualElements.setDomNodeChildren(element, [element.ownerDocument!.createTextNode(value)])
  } else {
    ;(innerTextNode as Text).data = value
  }
}
