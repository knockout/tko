
// Polyfills
if (!Array.isArray) {
  Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}

// from https://github.com/jonschlinkert/is-plain-object
function isPlainObject(o) {
  return !!o && typeof o === 'object' && o.constructor === Object;
};

// from FastDOM
var raf = window.requestAnimationFrame
  || window.webkitRequestAnimationFrame
  || window.mozRequestAnimationFrame
  || window.msRequestAnimationFrame
  || function(cb) { return window.setTimeout(cb, 1000 / 60); };


// Spec is the usual for a `foreach` binding i.e. {
//    name: template id string  (optional)
//    data: array
//    as: string
//    ...
//    + element: DOMNode
// }
function init_from_object(spec) {
  var data = spec.data,
      element = spec.element,
      templateNodes = spec.name ? [document.getElementById(spec.name)] : [].slice.call(element.children);

  // Initialize the data
  if (ko.isObservable(data) && !data.indexOf) {
    data = data.extend({trackArrayChanges: true});
  }

  // Clear the element
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }

  // Prime content
  ko.utils.arrayForEach(ko.unwrap(data), function(v) {
    var childContext = spec.$context.createChildContext(v, spec.as || null);
    ko.utils.arrayForEach(templateNodes, function (node) {
      node = node.cloneNode(true);
      element.insertBefore(node, null);
      ko.applyBindingsToDescendants(childContext, node);
    })
  })

  // Start subscriptions
  function startChangeUpdate() {

  }

  function on_array_change(changeSet) {
    console.log("CHANGES!", changeSet)
    changes.push.apply(changes, changeSet);
    startChangeUpdate();
  }

  changeSubs = data.subscribe(on_array_change, null, 'arrayChange');

  ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
    changeSubs.dispose();
    changes.length = 0;
  });
}

// Valid valueAccessors:
//    []
//    ko.observable([])
//    ko.observableArray([])
//    ko.computed
//    {data: array, name: string, as: string}
function init(element, valueAccessor, bindings, vm, context) {
  var value = valueAccessor(),
      spec = {};
  try{
    if (isPlainObject(value)) {
      value.element = value.element || element;
      value.$context = context;
      init_from_object(value);
    } else {
      init_from_object({element: element, data: value, $context: context});
    }
  } catch(e) {
    console.error("FF error", e.stack);
  }
  return {controlsDescendantBindings: true}
};

ko.bindingHandlers['fast-foreach'] = {
  init: init
};