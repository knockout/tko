//
// DOM - CSS
//

import { arrayForEach, addOrRemoveItem } from './array.js';

// For details on the pattern for changing node classes
// see: https://github.com/knockout/knockout/issues/1597
var cssClassNameRegex = /\S+/g;


function toggleDomNodeCssClass(node, classNames, shouldHaveClass) {
    var addOrRemoveFn;
    if (!classNames) { return; }
    if (typeof node.classList === 'object') {
        addOrRemoveFn = node.classList[shouldHaveClass ? 'add' : 'remove'];
        arrayForEach(classNames.match(cssClassNameRegex), function(className) {
            addOrRemoveFn.call(node.classList, className);
        });
    } else if (typeof node.className['baseVal'] === 'string') {
        // SVG tag .classNames is an SVGAnimatedString instance
        toggleObjectClassPropertyString(node.className, 'baseVal', classNames, shouldHaveClass);
    } else {
        // node.className ought to be a string.
        toggleObjectClassPropertyString(node, 'className', classNames, shouldHaveClass);
    }
}


function toggleObjectClassPropertyString(obj, prop, classNames, shouldHaveClass) {
    // obj/prop is either a node/'className' or a SVGAnimatedString/'baseVal'.
    var currentClassNames = obj[prop].match(cssClassNameRegex) || [];
    arrayForEach(classNames.match(cssClassNameRegex), function(className) {
        addOrRemoveItem(currentClassNames, className, shouldHaveClass);
    });
    obj[prop] = currentClassNames.join(" ");
}


export { toggleDomNodeCssClass };
