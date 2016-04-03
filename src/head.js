  var Identifier, Expression, Parser, Node;

  function value_of(item) {
    if (item instanceof Identifier || item instanceof Expression) {
      return item.get_value();
    }
    return item;
  }

  // We re-use the cache/parsing from the original binding provider,
  // in nodeParamsToObject (ala. getComponentParamsFromCustomElement)
  var originalBindingProviderInstance = new ko.bindingProvider();

  // The following are also in ko.*, but not exposed.
  function _object_map(source, mapping) {
    // ko.utils.objectMap
    if (!source) {
      return source;
    }
    var target = {};
    for (var prop in source) {
      if (source.hasOwnProperty(prop)) {
        target[prop] = mapping(source[prop], prop, source);
      }
    }
    return target;
  }

  // ko.virtualElements.virtualNodeBindingValue
  var commentNodesHaveTextProperty = document && document.createComment("test").text === "<!--test-->";
  var startCommentRegex = commentNodesHaveTextProperty ? /^<!--\s*ko(?:\s+([\s\S]+))?\s*-->$/ : /^\s*ko(?:\s+([\s\S]+))?\s*$/;

  function _virtualNodeBindingValue(node) {
    var regexMatch = (commentNodesHaveTextProperty ? node.text : node.nodeValue).match(startCommentRegex);
    return regexMatch ? regexMatch[1] : null;
  }
