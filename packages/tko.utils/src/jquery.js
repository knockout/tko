//
// jQuery
//
// TODO: deprecate in favour of options.$

export var jQueryInstance = window && window.jQuery;

export function jQuerySetInstance(jquery) {
    jQueryInstance = jquery;
}
