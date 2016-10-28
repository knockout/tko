
import {
    arrayMap
} from 'tko.utils';


jasmine.setNodeText = function(node, text) {
    'textContent' in node ? node.textContent = text : node.innerText = text;
};

jasmine.Matchers.prototype.toHaveNodeTypes = function (expectedTypes) {
    var values = arrayMap(this.actual, function (node) {
        return node.nodeType;
    });
    this.actual = values;   // Fix explanatory message
    return this.env.equals_(values, expectedTypes);
};

function cleanedHtml(node) {
    var cleanedHtml = node.innerHTML.toLowerCase().replace(/\r\n/g, "");
    // IE < 9 strips whitespace immediately following comment nodes. Normalize by doing the same on all browsers.
    cleanedHtml = cleanedHtml.replace(/(<!--.*?-->)\s*/g, "$1");
    // Also remove __ko__ expando properties (for DOM data) - most browsers hide these anyway but IE < 9 includes them in innerHTML
    cleanedHtml = cleanedHtml.replace(/ __ko__\d+=\"(ko\d+|null)\"/g, "");
    return cleanedHtml;
}

jasmine.Matchers.prototype.toContainHtmlElementsAndText = function (expectedHtml) {
    this.actual = cleanedHtml(this.actual).replace(/<!--.+?-->/g, "");  // remove comments
    return this.actual === expectedHtml;
};