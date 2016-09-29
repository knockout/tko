//
// This becomes ko.options
// --
//
// This is the root 'options', which must be extended by others.

var options = {
    deferUpdates: false,

    useOnlyNativeEvents: false,

    protoProperty: '__ko_proto__',

    // Modify the default attribute from `data-bind`.
    defaultBindingAttribute: 'data-bind',

    // Enable/disable <!-- ko binding: ... -> style bindings
    allowVirtualElements: true,

    // Global variables that can be accessed from bindings.
    bindingGlobals: window,

    // An instance of the binding provider.
    bindingProviderInstance: null,

    // jQuery will be automatically set to window.jQuery in applyBindings
    // if it is (strictly equal to) undefined.  Set it to false or null to
    // disable automatically setting jQuery.
    jQuery: window && window.jQuery,

    taskScheduler: null,

    debug: false,

    // Filters for bindings
    //   data-bind="expression | filter_1 | filter_2"
    filters: {},

    onError: function (e) { throw e; },

    set: function (name, value) {
        options[name] = value;
    }
};

Object.defineProperty(options, '$', {
    get: function () { return options.jQuery; }
});


export default options;
