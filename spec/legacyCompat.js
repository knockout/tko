//
// The following tests for differences in the API exposed from ko 3.4 and tko.
//

// Built with
/*
 >>> function expose(obj) {
  var res = {}
  for (var o in obj) {
    if (o.length <= 2 || o[0] === '_') { continue }
    if (typeof obj[o] === 'function') {
        res[o] = 'function'
    } else if (typeof obj[o] === 'object') {
        res[o] = expose(obj[o])
    } else {
        res[o] = typeof res
    }
  }
  return res
 }
 JSON.stringify(expose(ko), null, 2)
*/
var API = {
    "version": "object",
    "options": {
        "deferUpdates": "object",
        "useOnlyNativeEvents": "object"
    },
    "utils": {
        "extend": "function",
        "setTimeout": "function",
        "arrayForEach": "function",
        "arrayFirst": "function",
        "arrayFilter": "function",
        "arrayGetDistinctValues": "function",
        "arrayIndexOf": "function",
        "arrayMap": "function",
        "arrayPushAll": "function",
        "arrayRemoveItem": "function",
        "fieldsIncludedWithJsonPost": {},
        "getFormFields": "function",
        "peekObservable": "function",
        "postJson": "function",
        "parseJson": "function",
        "registerEventHandler": "function",
        "stringifyJson": "function",
        "range": "function",
        "toggleDomNodeCssClass": "function",
        "triggerEvent": "function",
        "unwrapObservable": "function",
        "objectForEach": "function",
        "addOrRemoveItem": "function",
        "setTextContent": "function",
        "domData": {
            "get": "function",
            "set": "function",
            "clear": "function"
        },
        "domNodeDisposal": {
            "removeNode": "function",
            "cleanExternalData": "function",
            "addDisposeCallback": "function",
            "removeDisposeCallback": "function"
        },
        "parseHtmlFragment": "function",
        "setHtml": "function",
        "compareArrays": "function",
        "setDomNodeChildrenFromArrayMapping": "function"
    },
    "unwrap": "function",
    "removeNode": "function",
    "cleanNode": "function",
    "memoization": {
        "memoize": "function",
        "unmemoize": "function",
        "parseMemoText": "function",
        "unmemoizeDomNodeAndDescendants": "function"
    },
    "tasks": {
        "scheduler": "function",
        "cancel": "function",
        "resetForTesting": "function",
        "schedule": "function",
        "runEarly": "function"
    },
    "extenders": {
        "throttle": "function",
        "rateLimit": "function",
        "deferred": "function",
        "notify": "function",
        "trackArrayChanges": "function"
    },
    "subscribable": "function",
    "isSubscribable": "function",
    "computedContext": {
        "end": "function",
        "getDependenciesCount": "function",
        "isInitial": "function"
    },
    "ignoreDependencies": "function",
    "observable": "function",
    "isObservable": "function",
    "isWriteableObservable": "function",
    "isWritableObservable": "function",
    "observableArray": "function",
    "computed": "function",
    "dependentObservable": "function",
    "isComputed": "function",
    "isPureComputed": "function",
    "pureComputed": "function",
    "toJSON": "function",
    "toJS": "function",
    "selectExtensions": {
        "readValue": "function",
        "writeValue": "function"
    },
    "expressionRewriting": {
        "bindingRewriteValidators": {
            "foreach": "object",
            "ifnot": "object",
            "with": "object",
            "template": "function"
        },
        "parseObjectLiteral": "function",
        "preProcessBindings": "function",
        "insertPropertyAccessorsIntoJson": "function"
    },
    "jsonExpressionRewriting": {
        "bindingRewriteValidators": {
            "foreach": "object",
            "ifnot": "object",
            "with": "object",
            "template": "function"
        },
        "parseObjectLiteral": "function",
        "preProcessBindings": "function",
        "insertPropertyAccessorsIntoJson": "function"
    },
    "virtualElements": {
        "childNodes": "function",
        "firstChild": "function",
        "nextSibling": "function",
        "allowedBindings": {
            "component": "object",
            "foreach": "object",
            "ifnot": "object",
            "with": "object",
            "text": "object",
            "template": "object"
        },
        "emptyNode": "function",
        "insertAfter": "function",
        "prepend": "function",
        "setDomNodeChildren": "function"
    },
    "bindingProvider": "function",
    "getBindingHandler": "function",
    "bindingHandlers": {
        "component": {
            "init": "function"
        },
        "attr": {
            "update": "function"
        },
        "checked": {
            "after": {},
            "init": "function"
        },
        "checkedValue": {
            "update": "function"
        },
        "css": {
            "update": "function"
        },
        "enable": {
            "update": "function"
        },
        "disable": {
            "update": "function"
        },
        "event": {
            "init": "function"
        },
        "foreach": {
            "init": "function",
            "update": "function"
        },
        "hasfocus": {
            "init": "function",
            "update": "function"
        },
        "hasFocus": {
            "init": "function",
            "update": "function"
        },
        "html": {
            "init": "function",
            "update": "function"
        },
        "ifnot": {
            "init": "function"
        },
        "with": {
            "init": "function"
        },
        "options": {
            "init": "function",
            "update": "function"
        },
        "selectedOptions": {
            "after": {},
            "init": "function",
            "update": "function"
        },
        "style": {
            "update": "function"
        },
        "submit": {
            "init": "function"
        },
        "text": {
            "init": "function",
            "update": "function"
        },
        "textInput": {
            "init": "function"
        },
        "textinput": {
            "preprocess": "function"
        },
        "uniqueName": {
            "init": "function"
        },
        "value": {
            "after": {},
            "init": "function",
            "update": "function"
        },
        "visible": {
            "update": "function"
        },
        "click": {
            "init": "function"
        },
        "template": {
            "init": "function",
            "update": "function"
        }
    },
    "applyBindings": "function",
    "applyBindingsToDescendants": "function",
    "applyBindingAccessorsToNode": "function",
    "applyBindingsToNode": "function",
    "contextFor": "function",
    "dataFor": "function",
    "components": {
        "get": "function",
        "loaders": {},
        "clearCachedDefinition": "function",
        "register": "function",
        "isRegistered": "function",
        "unregister": "function",
        "defaultLoader": {
            "getConfig": "function",
            "loadComponent": "function",
            "loadTemplate": "function",
            "loadViewModel": "function"
        },
        "getComponentNameForNode": "function"
    },
    "templateEngine": "function",
    "templateSources": {
        "domElement": "function",
        "anonymousTemplate": "function"
    },
    "setTemplateEngine": "function",
    "renderTemplate": "function",
    "nativeTemplateEngine": "function",
    "jqueryTmplTemplateEngine": "function"
};


describe("Compared to Knockout 3.4", function() {
    it("matches the expected API", function() {
        /* FIXME */
    });
});
