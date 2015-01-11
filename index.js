
// from FastDOM
var raf = window.requestAnimationFrame
  || window.webkitRequestAnimationFrame
  || window.mozRequestAnimationFrame
  || window.msRequestAnimationFrame
  || function(cb) { return window.setTimeout(cb, 1000 / 60); };


ko.bindingHandlers.fasteach = {
  init: function (element, valueAccessor) {
    var obs = valueAccessor(),
        arrayObs,
        changeSubs,
        changes = [];
    if (!ko.isObservable(obs)) { obs = ko.observableArray(obs); }
    if (!obs.indexOf) { obs = obs.extend({trackArrayChanges: true}); }

    function startChangeUpdate() {
      
    }

    function on_array_change(changeSet) {
      changes.push.apply(changes, changeSet);
      startChangeUpdate();
    }

    changeSubs = obs.subscribe(on_array_change, null, 'arrayChange');

    ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
      changeSubs.dispose();
      changes.length = 0;
    });

    return {controlsDescendantBindings: true}
  }
};