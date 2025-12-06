import { Provider } from "@tko/provider";
import type { KnockoutInstance } from "@tko/builder";

export interface CustomBindingGlobalProperties {
  [customBindingName: string]: any;
}

export type BindingStringPreparsersFunction = (bindingString: string) => string;

//
// This becomes ko.options
// --
//
// This is the root 'options', which must be extended by others.
export class Options {
  // The following options can be set on ko.options to make a function rewriting or something similar.
  bindingStringPreparsers: BindingStringPreparsersFunction[] = []
  
  // Reference to the own knockout instance
  knockoutInstance: KnockoutInstance | null = null
  
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
  bindingProviderInstance: Provider

  // Whether the `with` binding creates a child context when used with `as`.
  createChildContextWithAs: boolean = false

    // jQuery will be automatically set to globalThis.jQuery in applyBindings
    // if it is (strictly equal to) undefined.  Set it to false or null to
    // disable automatically setting jQuery.
  jQuery : JQueryStatic | false | null = (globalThis as any).jQuery

  Promise: PromiseConstructor = globalThis.Promise

  taskScheduler: any = null

  debug: boolean = false
  /**
   * The maximum size of template to parse.
   * Set to 0 to disable the limit.
   */
  templateSizeLimit: number = 4096

  /**
   * Whether or not to allow script tags in templates.
   * If false, an error will be thrown if a script tag is detected in the template.
   * It is not recommended to set this to true.
   */
  allowScriptTagsInTemplates: boolean = false

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
  getBindingHandler (key : string) : any { return null; }
  cleanExternalData (node : Node, callback? : Function) {}
}

const options = new Options()

Object.defineProperty(options, '$', {
  get: function () { return options.jQuery }
})

export default options
