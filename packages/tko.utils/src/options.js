//
// This becomes ko.options
// --
//
// This is the root 'options', which must be extended by others.

export default {
    deferUpdates: false,
    useOnlyNativeEvents: false,
    protoProperty: '__ko_proto__',

    // jQuery will be automatically set to window.jQuery in applyBindings
    // if it is (strictly equal to) undefined.  Set it to false or null to
    // disable automatically setting jQuery.
    jQuery: undefined,
    debug: false,
    $: window && window.jQuery,
    onError: function (e) { throw e; }
};
