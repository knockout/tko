/*!
  Knockout Fast Foreach v0.1.0 (2015-01-11T19:43:26.086Z)
  By: Brian M Hunt (C) 2015
  License: MIT
*/
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['knockout'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('knockout'));
  } else {
    root.KnockoutElse = factory(root.ko);
  }
}(this, function (ko) {

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


// Spec is an object that may include:
//    template: DOMFragment
//    arrayObs: observable array with trackChanges
function apply(spec) {
  function startChangeUpdate() {

  }

  function on_array_change(changeSet) {
    console.log("CHANGES!", changeSet)
    changes.push.apply(changes, changeSet);
    startChangeUpdate();
  }

  changeSubs = obs.subscribe(on_array_change, null, 'arrayChange');

  ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
    changeSubs.dispose();
    changes.length = 0;
  });
}


// Spec is the usual for a `foreach` binding i.e. {
//    name: template id string  (optional)
//    data: array
//    as: string
//    ...
//    + element: DOMNode
// }
function init_from_object(spec) {
  var data = spec.data,
      templateFrag = spec.name ? document.getElementById(spec.name) : element.innerHTML;

  if (!templateFrag) {
    throw new Error("knockout-fast-foreach was not given a template.")
  }

  // Initialize the data
  if (ko.isObservable(data) && !data.indexOf) {
    data = data.extend({trackArrayChanges: true});
  }  
}

// Valid valueAccessors:
//    []
//    ko.observable([])
//    ko.observableArray([])
//    ko.computed
//    {data: array, name: string, as: string}
function init(element, valueAccessor) {
  var value = valueAccessor(),
      spec = {};
  if (isPlainObject(value)) {
    value.element = value.element || element;
    init_from_object(value);
  } else {
    init_from_object({element: element, data: value});
  }
  return {controlsDescendantBindings: true}
};

ko.bindingHandlers['fast-foreach'] = {
  init: init
};// Exports
  return {init: init};
}));
