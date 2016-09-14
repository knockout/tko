
import {
  extend, options, ieVersion, makeArray, parseHtmlFragment
} from 'tko.utils';

import {
  templateEngine
} from './templateEngine'

import {
  setTemplateEngine
} from './templating'

export function nativeTemplateEngine () {
}

nativeTemplateEngine.prototype = new templateEngine();
nativeTemplateEngine.prototype.constructor = nativeTemplateEngine;
nativeTemplateEngine.prototype.renderTemplateSource = function(templateSource, bindingContext, options, templateDocument) {
    var useNodesIfAvailable = !(ieVersion < 9), // IE<9 cloneNode doesn't work properly
        templateNodesFunc = useNodesIfAvailable ? templateSource.nodes : null,
        templateNodes = templateNodesFunc ? templateSource.nodes() : null;

    if (templateNodes) {
        return makeArray(templateNodes.cloneNode(true).childNodes);
    } else {
        var templateText = templateSource.text();
        return parseHtmlFragment(templateText, templateDocument);
    }
};


nativeTemplateEngine.instance = new nativeTemplateEngine();
setTemplateEngine(nativeTemplateEngine.instance);
