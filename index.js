// index.js
// --------
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

// A range of nodes
// spec contains {start: Node, end: Node, parent: Node, index: int}
function NodeRange(spec) {
  this.parent = spec.parent;
  this.start = spec.start;
  this.end = spec.end;
  this.index = spec.index
}

NodeRange.prototype.remove = function remove() {
  if (this.start === null) return;
  var nodesRemoved = [];
  var ptr = this.start;
  while (ptr !== this.end) {
    ptr = ptr.nextSibling;
    this.parent.removeChild(this.start);
    this.start = ptr;
  }
  this.start = this.end = null;
}

NodeRange.prototype.insertAfter = function insertAfter(nodes) {
  var nextNode = this.end.nextSibling;
  for (var i = nodes.length - 1; i >= 0; --i) {
    nextNode = next.insertBefore(nodes[i]);
  }
}


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
      templateNode = spec.name ? [document.getElementById(spec.name)] 
                               : element.cloneNode(true),
      changeQueue = [],
      nodeList = [];

  // Insert a nodes at the given index
  function insertBoundNodeAtIndex(index, data) {
    var nodeCount = nodeList.length;
    var childContext = spec.$context.createChildContext(item, spec.as || null);
    index = (nodeCount + index) % nodeCount; // for modulo e.g. index of -1
    var nodeRange = new NodeRange({
      start: templateNode.firstChild,
      end: templateNode.lastChild,
      parent: element,
      index: index
    });
    nodeRange.insertAfter() /// ....
  }
  
  // Initialize the data
  if (ko.isObservable(data) && !data.indexOf) {
    data = data.extend({trackArrayChanges: true});
  }

  // Clear the element
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }

  // Prime content
  ko.utils.arrayForEach(ko.unwrap(data), function(item) {
    
    insertBoundNodeAtIndex(-1, item)
    ko.utils.arrayForEach(templateNode.children, function(child) {
      if (!child) return;
      var clone = child.cloneNode(true);
      element.insertBefore(clone, null);
      ko.applyBindingsToDescendants(childContext, clone);
    })
  })

  function applyChanges() {
    ko.utils.arrayForEach(changeQueue, function(change) {
      // Change is of the form {status: "deleted|added|...", index: nnn, value: ...}
      switch(change.status) {
        case 'deleted':

        case 'added':
          
          break;
        default:
          console.log("Unhandled array change:", change)
      }
    });
    changeQueue.length = 0;
  }

  // Start subscriptions
  function on_array_change(changeSet) {
    ko.utils.forEach(changeSet, function(change) {
      changeQueue.append(change);
    })
    // raf(applyChanges);
    applyChanges()
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