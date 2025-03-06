//
// This becomes ko.options
// --
//
// This is the root 'options', which must be extended by others.

const options = {
  deferUpdates: false,

  useOnlyNativeEvents: false,

  protoProperty: '__ko_proto__',

    // Modify the default attribute from `data-bind`.
  defaultBindingAttribute: 'data-bind',

    // Enable/disable <!-- ko binding: ... -> style bindings
  allowVirtualElements: true,

    // Global variables that can be accessed from bindings.
  bindingGlobals: Object.create(null),

    // An instance of the binding provider.
  bindingProviderInstance: null,

  // Whether the `with` binding creates a child context when used with `as`.
  createChildContextWithAs: false,

    // jQuery will be automatically set to globalThis.jQuery in applyBindings
    // if it is (strictly equal to) undefined.  Set it to false or null to
    // disable automatically setting jQuery.
  jQuery: globalThis.jQuery,

  Promise: globalThis.Promise,

  taskScheduler: null,

  /**
   * The maximum size of template to parse.
   * Set to 0 to disable the limit.
   */
  templateSizeLimit: 4096,

  /**
   * Whether or not to allow script tags in templates.
   * If false, an error will be thrown if a script tag is detected in the template.
   * It is not recommended to set this to true.
   */
  allowScriptTagsInTemplates: false,

  debug: false,

  global: globalThis,
  document: globalThis.document,

    // Filters for bindings
    //   data-bind="expression | filter_1 | filter_2"
  filters: {},

  // Used by the template binding.
  includeDestroyed: false,
  foreachHidesDestroyed: false,

  onError: function (e) { throw e },

  set: function (name, value) {
    options[name] = value
  },

  // Overload getBindingHandler to have a custom lookup function.
  getBindingHandler (/* key */) {},
  cleanExternalData (/* node, callback */) {}
}

Object.defineProperty(options, '$', {
  get: function () { return options.jQuery }
})

export default options
