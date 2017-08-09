//
// jQuery
//
// TODO: deprecate in favour of options.$

import options from './options'

export var jQueryInstance = options.global && options.global.jQuery;

export function jQuerySetInstance(jquery) {
    options.jQuery = jQueryInstance = jquery
}
