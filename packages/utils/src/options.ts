import { Provider } from "@tko/provider";

interface CustomBindingGlobalProperties {
  String;
  isObservable;
}


//
// This becomes ko.options
// --
//
// This is the root 'options', which must be extended by others.
export class Options {
  [key: string]: any;

  deferUpdates: boolean = false

  // Don't set this false, with jquery 3.7+
  useOnlyNativeEvents: boolean = true 

  // Use HTML5 <template> tags if is supported
  useTemplateTag: boolean = true

  protoProperty: string = '__ko_proto__'

  // Modify the default attribute from `data-bind`.
  defaultBindingAttribute: string = 'data-bind'

  // Enable/disable <!-- ko binding: ... -> style bindings
  allowVirtualElements: boolean = true

  // Global variables that can be accessed from bindings.
  bindingGlobals: Object & CustomBindingGlobalProperties = Object.create(null)

  // An instance of the binding provider.
  bindingProviderInstance: Provider

  // Whether the `with` binding creates a child context when used with `as`.
  createChildContextWithAs: boolean = false

  // jQuery will be automatically set to globalThis.jQuery in applyBindings
  // if it is (strictly equal to) undefined.  Set it to false or null to
  // disable automatically setting jQuery.
  disableJQueryUsage: boolean = false;

  get jQuery(): JQueryStatic | undefined {
    if (this.disableJQueryUsage)
      return;
    return (globalThis as any).jQuery;
  }

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

  onError(e: Error): void { throw e }

  set(name: string, value: any): void {
    this[name] = value
  }

  // Overload getBindingHandler to have a custom lookup function.
  getBindingHandler(key: string): any { return null; }
  cleanExternalData(node: Node, callback?: Function) { }
}

const options = new Options()

export default options
