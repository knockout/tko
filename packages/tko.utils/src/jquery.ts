//
// jQuery
//
// TODO: deprecate in favour of options.$

import options from './options';

export let jQueryInstance = options.jQuery;

export function jQuerySetInstance(jquery: JQueryStatic) {
  options.jQuery = jQueryInstance = jquery;
}
