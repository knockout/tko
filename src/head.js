;(function(factory) {
    //AMD
    if (typeof define === "function" && define.amd) {
        define(["knockout", "exports"], factory);
        //normal script tag
    } else {
        factory(ko);
    }
}(function(ko, exports, undefined) {
  var Identifier, Expression, Parser, Node;

  function value_of(item) {
    if (item instanceof Identifier || item instanceof Expression) {
      return item.get_value();
    }
    return item;
  }
