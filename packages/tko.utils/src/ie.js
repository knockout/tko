//
// Detection and Workarounds for Internet Explorer
//
/* eslint no-empty: 0 */

// Detect IE versions for bug workarounds (uses IE conditionals, not UA string, for robustness)
// Note that, since IE 10 does not support conditional comments, the following logic only detects IE < 10.
// Currently this is by design, since IE 10+ behaves correctly when treated as a standard browser.
// If there is a future need to detect specific versions of IE10+, we will amend this.
var ieVersion = document && (function() {
    var version = 3, div = document.createElement('div'), iElems = div.getElementsByTagName('i');

    // Keep constructing conditional HTML blocks until we hit one that resolves to an empty fragment
    while (
        div.innerHTML = '<!--[if gt IE ' + (++version) + ']><i></i><![endif]-->',
        iElems[0]
    ) {}
    return version > 4 ? version : undefined;
}());

var isIe6 = ieVersion === 6;
var isIe7 = ieVersion === 7;


export { ieVersion, isIe6, isIe7 };
