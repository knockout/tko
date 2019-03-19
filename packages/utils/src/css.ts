//
// DOM - CSS
//

import { arrayForEach, addOrRemoveItem } from './array';

// For details on the pattern for changing node classes
// see: https://github.com/knockout/knockout/issues/1597
const cssClassNameRegex = /\S+/g;

function toggleDomNodeCssClass(node: HTMLElement, classNames: string, shouldHaveClass?: boolean) {
  let addOrRemoveFn: (className: string) => void;
  if (!classNames) { return; }
  if (typeof node.classList === 'object') {
    addOrRemoveFn = node.classList[shouldHaveClass ? 'add' : 'remove'];
    arrayForEach(classNames.match(cssClassNameRegex)!, (className: string) => {
      addOrRemoveFn.call(node.classList, className);
    });
  } else if (typeof (node.className as any).baseVal === 'string') {
        // SVG tag .classNames is an SVGAnimatedString instance
    toggleObjectClassPropertyString(node.className, 'baseVal', classNames, shouldHaveClass);
  } else {
        // node.className ought to be a string.
    toggleObjectClassPropertyString(node, 'className', classNames, shouldHaveClass);
  }
}

function toggleObjectClassPropertyString(obj: any, prop: string, classNames: string, shouldHaveClass?: boolean) {
    // obj/prop is either a node/'className' or a SVGAnimatedString/'baseVal'.
  const currentClassNames = obj[prop].match(cssClassNameRegex) || [];
  arrayForEach(classNames.match(cssClassNameRegex)!, (className: string) => {
    addOrRemoveItem(currentClassNames, className, shouldHaveClass);
  });

  obj[prop] = currentClassNames.join(' ');
}

export { toggleDomNodeCssClass };
