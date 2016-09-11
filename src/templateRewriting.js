import {
    applyBindingAccessorsToNode
} from 'tko.bind';

import {
  memoization
} from 'tko.utils'

import {
    options
} from 'tko.utils';

import {
  parseObjectLiteral
} from 'tko.provider';


var memoizeDataBindingAttributeSyntaxRegex = /(<([a-z]+\d*)(?:\s+(?!data-bind\s*=\s*)[a-z0-9\-]+(?:=(?:\"[^\"]*\"|\'[^\']*\'|[^>]*))?)*\s+)data-bind\s*=\s*(["'])([\s\S]*?)\3/gi;
var memoizeVirtualContainerBindingSyntaxRegex = /<!--\s*ko\b\s*([\s\S]*?)\s*-->/g;

function validateDataBindValuesForRewriting(keyValueArray) {
  /*var allValidators = ko.expressionRewriting.bindingRewriteValidators;
  for (var i = 0; i < keyValueArray.length; i++) {
      var key = keyValueArray[i]['key'];
      if (allValidators.hasOwnProperty(key)) {
          var validator = allValidators[key];

          if (typeof validator === "function") {
              var possibleErrorMessage = validator(keyValueArray[i]['value']);
              if (possibleErrorMessage)
                  throw new Error(possibleErrorMessage);
          } else if (!validator) {
              throw new Error("This template engine does not support the '" + key + "' binding within its templates");
          }
      }
  }*/
}

function constructMemoizedTagReplacement(dataBindAttributeValue, tagToRetain, nodeName, templateEngine) {
    var dataBindKeyValueArray = parseObjectLiteral(dataBindAttributeValue);
    validateDataBindValuesForRewriting(dataBindKeyValueArray);
    var rewrittenDataBindAttributeValue = options.bindingProviderInstance.preProcessBindings(dataBindKeyValueArray, {'valueAccessors':true});

    // For no obvious reason, Opera fails to evaluate rewrittenDataBindAttributeValue unless it's wrapped in an additional
    // anonymous function, even though Opera's built-in debugger can evaluate it anyway. No other browser requires this
    // extra indirection.
    //TODO: handle _tr_ambtns
    var applyBindingsToNextSiblingScript =
        "__tr_ambtns(function($context,$element){return(function(){return{ " + rewrittenDataBindAttributeValue + " } })()},'" + nodeName.toLowerCase() + "')";
    return templateEngine['createJavaScriptEvaluatorBlock'](applyBindingsToNextSiblingScript) + tagToRetain;
}

export function __tr_ambtns (bindings, nodeName) {
    return memoization.memoize(function (domNode, bindingContext) {
        var nodeToBind = domNode.nextSibling;
        if (nodeToBind && nodeToBind.nodeName.toLowerCase() === nodeName) {
            applyBindingAccessorsToNode(nodeToBind, bindings, bindingContext);
        }
    });
}

export var templateRewriting = {
    ensureTemplateIsRewritten: function (template, templateEngine, templateDocument) {
        if (!templateEngine['isTemplateRewritten'](template, templateDocument))
            templateEngine['rewriteTemplate'](template, function (htmlString) {
                return templateRewriting.memoizeBindingAttributeSyntax(htmlString, templateEngine);
            }, templateDocument);
    },

    memoizeBindingAttributeSyntax: function (htmlString, templateEngine) {
        return htmlString.replace(memoizeDataBindingAttributeSyntaxRegex, function () {
            return constructMemoizedTagReplacement(/* dataBindAttributeValue: */ arguments[4], /* tagToRetain: */ arguments[1], /* nodeName: */ arguments[2], templateEngine);
        }).replace(memoizeVirtualContainerBindingSyntaxRegex, function() {
            return constructMemoizedTagReplacement(/* dataBindAttributeValue: */ arguments[1], /* tagToRetain: */ "<!-- ko -->", /* nodeName: */ "#comment", templateEngine);
        });
    },

    applyMemoizedBindingsToNextSibling: __tr_ambtns
}



// Exported only because it has to be referenced by string lookup from within rewritten template
//ko.exportSymbol('__tr_ambtns', ko.templateRewriting.applyMemoizedBindingsToNextSibling);
