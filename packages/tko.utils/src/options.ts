//
// This becomes ko.options
// --
//
// This is the root 'options', which must be extended by others.

// tslint:disable-next-line:variable-name
let _global: Window;
let jq: JQueryStatic|null = null;
let promise: PromiseConstructorLike|null = null;
let document: Document|null = null;

try {
  _global = window;
  jq = jQuery;
  document = window.document;
} catch (e) {
  _global = global as any as Window;
}

if ('Promise' in _global) {
  promise = (_global as any).Promise as PromiseConstructorLike;
}

// tslint:disable-next-line:ban-types
type TaskScheduler = (callback: Function) => any;
const taskScheduler = null; // Workaround for typedef

const options = {
  deferUpdates: false,

  useOnlyNativeEvents: false,

  protoProperty: '__ko_proto__',

  /**
   * Modify the default attribute from `data-bind`.
   */
  defaultBindingAttribute: 'data-bind',

  /**
   * Enable/disable <!-- ko binding: ... -> style bindings
   */
  allowVirtualElements: true,

  /**
   * Global variables that can be accessed from bindings.
   */
  bindingGlobals: _global,

  /**
   * An instance of the binding provider.
   */
  bindingProviderInstance: null,

  /**
   * jQuery will be automatically set to _global.jQuery in applyBindings
   * if it is (strictly equal to) undefined.  Set it to false or null to
   * disable automatically setting jQuery.
   */
  jQuery: jq,

  Promise: promise,

  taskScheduler: (taskScheduler as TaskScheduler|null),

  debug: false,

  global: _global,
  document,

  /**
   * Filters for bindings
   *   data-bind="expression | filter_1 | filter_2"
   */
  filters: {},

  onError(e: Error) { throw e; },

  set(name: string, value: any) {
    (options as any)[name] = value;
  },

  $: jQuery
};

export default options;
