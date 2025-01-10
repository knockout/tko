declare var jQuery : any

interface CustomBindingGlobalProperties {
  String;
  isObservable;
}

//
// This becomes ko.options
// --
//
// This is the root 'options', which must be extended by others.
class OptionsClass {
  [key: string]: any;
  
  deferUpdates: boolean = false

  useOnlyNativeEvents: boolean = false

  protoProperty: string = '__ko_proto__'

    // Modify the default attribute from `data-bind`.
  defaultBindingAttribute: string = 'data-bind'

    // Enable/disable <!-- ko binding: ... -> style bindings
  allowVirtualElements: boolean = true


    // Global variables that can be accessed from bindings.
  bindingGlobals: Object & CustomBindingGlobalProperties = Object.create(null)

    // An instance of the binding provider.
  bindingProviderInstance: Object | any = null

  // Whether the `with` binding creates a child context when used with `as`.
  createChildContextWithAs: boolean = false

    // jQuery will be automatically set to globalThis.jQuery in applyBindings
    // if it is (strictly equal to) undefined.  Set it to false or null to
    // disable automatically setting jQuery.
  jQuery: any = globalThis.jQueryInstance

  Promise: PromiseConstructor = globalThis.Promise

  taskScheduler: any = null

  debug: boolean = false

  global: any = globalThis
  document: Document = globalThis.document

    // Filters for bindings
    //   data-bind="expression | filter_1 | filter_2"
  filters: any = {}

  // Used by the template binding.
  includeDestroyed: boolean = false

  foreachHidesDestroyed: boolean = false

  onError (e : Error) : void { throw e }

  set(name : string, value : any) : void {
    this[name] = value
  }

  // Overload getBindingHandler to have a custom lookup function.
  getBindingHandler (key) : any { return null; }
  cleanExternalData (node, callback?) {}
}

const options = new OptionsClass()

Object.defineProperty(options, '$', {
  get: function () { return options.jQuery }
})

export default options
