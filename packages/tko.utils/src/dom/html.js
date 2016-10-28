//
// HTML-based manipulation
//
import { stringTrim } from '../string.js';
import { makeArray } from '../array.js';
import { emptyDomNode } from './manipulation.js';
import { jQueryInstance } from '../jquery.js';
import * as virtualElements from './virtualElements';


var none = [0, "", ""],
    table = [1, "<table>", "</table>"],
    tbody = [2, "<table><tbody>", "</tbody></table>"],
    colgroup = [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"],
    tr = [3, "<table><tbody><tr>", "</tr></tbody></table>"],
    select = [1, "<select multiple='multiple'>", "</select>"],
    fieldset = [1, "<fieldset>", "</fieldset>"],
    map = [1, "<map>", "</map>"],
    object = [1, "<object>", "</object>"],
    lookup = {
        'area': map,
        'col': colgroup,
        'colgroup': table,
        'caption': table,
        'legend': fieldset,
        'thead': table,
        'tbody': table,
        'tfoot': table,
        'tr': tbody,
        'td': tr,
        'th': tr,
        'option': select,
        'optgroup': select,
        'param': object
    },

    // The canonical way to test that the HTML5 <template> tag is supported
    supportsTemplateTag = 'content' in document.createElement('template');


function getWrap(tags) {
    var m = tags.match(/^<([a-z]+)[ >]/);
    return (m && lookup[m[1]]) || none;
}


function simpleHtmlParse(html, documentContext) {
    documentContext || (documentContext = document);
    var windowContext = documentContext['parentWindow'] || documentContext['defaultView'] || window;

    // Based on jQuery's "clean" function, but only accounting for table-related elements.
    // If you have referenced jQuery, this won't be used anyway - KO will use jQuery's "clean" function directly

    // Note that there's still an issue in IE < 9 whereby it will discard comment nodes that are the first child of
    // a descendant node. For example: "<div><!-- mycomment -->abc</div>" will get parsed as "<div>abc</div>"
    // This won't affect anyone who has referenced jQuery, and there's always the workaround of inserting a dummy node
    // (possibly a text node) in front of the comment. So, KO does not attempt to workaround this IE issue automatically at present.

    // Trim whitespace, otherwise indexOf won't work as expected
    var tags = stringTrim(html).toLowerCase(), div = documentContext.createElement("div"),
        wrap = getWrap(tags),
        depth = wrap[0];

    // Go to html and back, then peel off extra wrappers
    // Note that we always prefix with some dummy text, because otherwise, IE<9 will strip out leading comment nodes in descendants. Total madness.
    var markup = "ignored<div>" + wrap[1] + html + wrap[2] + "</div>";
    if (typeof windowContext['innerShiv'] == "function") {
        // Note that innerShiv is deprecated in favour of html5shiv. We should consider adding
        // support for html5shiv (except if no explicit support is needed, e.g., if html5shiv
        // somehow shims the native APIs so it just works anyway)
        div.appendChild(windowContext['innerShiv'](markup));
    } else {
        div.innerHTML = markup;
    }

    // Move to the right depth
    while (depth--)
        div = div.lastChild;

    return makeArray(div.lastChild.childNodes);
}


function templateHtmlParse(html, documentContext) {
    if (!documentContext) { documentContext = document; }
    var template = documentContext.createElement('template');
    template.innerHTML = html;
    return makeArray(template.content.childNodes);
}


function jQueryHtmlParse(html, documentContext) {
    // jQuery's "parseHTML" function was introduced in jQuery 1.8.0 and is a documented public API.
    if (jQueryInstance.parseHTML) {
        return jQueryInstance.parseHTML(html, documentContext) || []; // Ensure we always return an array and never null
    } else {
        // For jQuery < 1.8.0, we fall back on the undocumented internal "clean" function.
        var elems = jQueryInstance.clean([html], documentContext);

        // As of jQuery 1.7.1, jQuery parses the HTML by appending it to some dummy parent nodes held in an in-memory document fragment.
        // Unfortunately, it never clears the dummy parent nodes from the document fragment, so it leaks memory over time.
        // Fix this by finding the top-most dummy parent element, and detaching it from its owner fragment.
        if (elems && elems[0]) {
            // Find the top-most parent element that's a direct child of a document fragment
            var elem = elems[0];
            while (elem.parentNode && elem.parentNode.nodeType !== 11 /* i.e., DocumentFragment */)
                elem = elem.parentNode;
            // ... then detach it
            if (elem.parentNode)
                elem.parentNode.removeChild(elem);
        }

        return elems;
    }
}


/**
 * parseHtmlFragment converts a string into an array of DOM Nodes.
 * If supported, it uses <template>-tag parsing, falling back on
 * jQuery parsing (if jQuery is present), and finally on a
 * straightforward parser.
 *
 * @param  {string} html            To be parsed.
 * @param  {Object} documentContext That owns the executing code.
 * @return {[DOMNode]}              Parsed DOM Nodes
 */
export function parseHtmlFragment(html, documentContext) {
    // Prefer <template>-tag based HTML parsing.
    return supportsTemplateTag ? templateHtmlParse(html, documentContext) :

        // Benefit from jQuery's on old browsers, where possible
        // NOTE: jQuery's HTML parsing fails on element names like tr-*.
        // See: https://github.com/jquery/jquery/pull/1988
        (jQueryInstance ? jQueryHtmlParse(html, documentContext) :

        // ... otherwise, this simple logic will do in most common cases.
        simpleHtmlParse(html, documentContext));
}


/**
  * setHtml empties the node's contents, unwraps the HTML, and
  * sets the node's HTML using jQuery.html or parseHtmlFragment
  *
  * @param {DOMNode} node Node in which HTML needs to be set
  * @param {DOMNode} html HTML to be inserted in node
  * @returns undefined
  */
export function setHtml(node, html) {
    emptyDomNode(node);

    // There's few cases where we would want to display a stringified
    // function, so we unwrap it.
    if (typeof html === 'function') {
        html = html();
    }

    if ((html !== null) && (html !== undefined)) {
        if (typeof html !== 'string')
            html = html.toString();

        // If the browser supports <template> tags, prefer that, as
        // it obviates all the complex workarounds of jQuery.
        //
        // However, jQuery contains a lot of sophisticated code to parse arbitrary HTML fragments,
        // for example <tr> elements which are not normally allowed to exist on their own.
        // If you've referenced jQuery (and template tags are not supported) we'll use that rather than duplicating its code.
        if (jQueryInstance && !supportsTemplateTag) {
            jQueryInstance(node).html(html);
        } else {
            // ... otherwise, use KO's own parsing logic.
            var parsedNodes = parseHtmlFragment(html, node.ownerDocument);

            if (node.nodeType === 8) {
                if (html === null) {
                    virtualElements.emptyNode(node);
                } else {
                    virtualElements.setDomNodeChildren(node, parsedNodes);
                }
            } else {
                for (var i = 0; i < parsedNodes.length; i++)
                    node.appendChild(parsedNodes[i]);
            }
        }
    }
}