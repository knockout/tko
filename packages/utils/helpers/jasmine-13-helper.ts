/// <reference types="jasmine" />
/// <reference types="jquery" />


/*
 * Configure the Jasmine testing framework.
 */
 /* globals runs, waitsFor, jasmine */


 
import {
  arrayMap, arrayFilter, ieVersion, selectExtensions, hasOwnProperty
} from '../dist/'


window.DEBUG = true;
window.amdRequire = window.require;

// Use a different variable name (not 'jQuery') to avoid overwriting
// window.jQuery with 'undefined' on IE < 9
window.jQueryInstance = window.jQuery;

jasmine.updateInterval = 500;

/*
    Some helper functions for jasmine on the browser
 */
jasmine.resolve = function (promise : Promise<boolean>) {
  let complete = false
  runs(() => promise.then((result) => { complete = result || true }))
  waitsFor(() => complete)
}

jasmine.prepareTestNode = function() : HTMLElement {
    // The bindings specs make frequent use of this utility function to set up
    // a clean new DOM node they can execute code against
    var existingNode = document.getElementById("testNode");
    if (existingNode !== null && existingNode.parentNode)
        existingNode.parentNode.removeChild(existingNode);
    var testNode = document.createElement("div");
    testNode.id = "testNode";
    document.body.appendChild(testNode);

    return testNode;
};

jasmine.Clock.mockScheduler = function (callback) {
    setTimeout(callback, 0);
};


export function useMockForTasks(options) {
    jasmine.Clock.useMock();

    // Make sure tasks is using setTimeout so that it uses the mock clock
    if (options.taskScheduler != jasmine.Clock.mockScheduler) {
        jasmine.getEnv().currentSpec.restoreAfter(options, 'taskScheduler');
        options.taskScheduler = jasmine.Clock.mockScheduler;
    }
}

jasmine.Spec.prototype.restoreAfter = function(object, propertyName) {
    var originalValue = object[propertyName];
    this.after(function() {
        object[propertyName] = originalValue;
    });
};

jasmine.nodeText = function(node) {
    return node.nodeType == 3 ? node.data : 'textContent' in node ? node.textContent : node.innerText;
};

jasmine.browserSupportsProtoAssignment = { __proto__: [] } instanceof Array;


jasmine.ieVersion = ieVersion;

jasmine.setNodeText = function(node, text:string) {
    'textContent' in node ? node.textContent = text : node.innerText = text;
};


function cleanedHtml(node) {
    var cleanedHtml = node.innerHTML.toLowerCase().replace(/\r\n/g, "");
    // IE < 9 strips whitespace immediately following comment nodes. Normalize by doing the same on all browsers.
    cleanedHtml = cleanedHtml.replace(/(<!--.*?-->)\s*/g, "$1");
    // Also remove __ko__ expando properties (for DOM data) - most browsers hide these anyway but IE < 9 includes them in innerHTML
    cleanedHtml = cleanedHtml.replace(/ __ko__\d+=\"(ko\d+|null)\"/g, "");
    return cleanedHtml;
}

/*
    Custom Matchers
    ~~~~~~~~~~~~~~~
 */
var matchers = {

    toHaveNodeTypes  (expectedTypes) {
        var values = arrayMap(this.actual, function (node) {
            return node.nodeType;
        });
        this.actual = values;   // Fix explanatory message
        return this.env.equals_(values, expectedTypes);
    },

    toContainHtmlElementsAndText (expectedHtml) {
        this.actual = cleanedHtml(this.actual).replace(/<!--.+?-->/g, "");  // remove comments
        return this.actual === expectedHtml;
    },

  toContainText (expectedText, ignoreSpaces) {
      if (ignoreSpaces) {
          expectedText = expectedText.replace(/\s/g, "");
      }

      var actualText = jasmine.nodeText(this.actual);
      var cleanedActualText = actualText.replace(/\r\n/g, "\n");
      if (ignoreSpaces) {
          cleanedActualText = cleanedActualText.replace(/\s/g, "");
      }

      this.actual = cleanedActualText;    // Fix explanatory message
      return cleanedActualText === expectedText;
  },

  toHaveOwnProperties (expectedProperties) {
      var ownProperties = new Array();
      for (var prop in this.actual) {
          if (hasOwnProperty(this.actual, prop)) {
              ownProperties.push(prop);
          }
      }
      return this.env.equals_(ownProperties, expectedProperties);
  },

  toHaveTexts (expectedTexts) {
      var texts = arrayMap(this.actual.childNodes, jasmine.nodeText);
      this.actual = texts;   // Fix explanatory message
      return this.env.equals_(texts, expectedTexts);
  },

  toHaveValues (expectedValues) {
      var values = arrayFilter(
        arrayMap(this.actual.childNodes, node => node.value),
        value => value !== undefined)
      this.actual = values   // Fix explanatory message
      return this.env.equals_(values, expectedValues)
  },


  toHaveCheckedStates (expectedValues) {
      const values = arrayMap(this.actual.childNodes, (node) =>  node.checked)
      this.actual = values;   // Fix explanatory message
     return this.env.equals_(values, expectedValues)
  },

  toThrowContaining(expected) {
      var exception;
      try {
          this.actual();
      } catch (e) {
          exception = e;
      }
      var exceptionMessage = exception && (exception.message || exception);

      this.message = function () {
          var notText = this.isNot ? " not" : "";
          var expectation = "Expected " + this.actual.toString() + notText + " to throw exception containing '" + expected + "'";
          var result = exception ? (", but it threw '" + exceptionMessage + "'") : ", but it did not throw anything";
          return expectation + result;
      };

      return exception ? this.env.contains_(exceptionMessage, expected) : false;
  },

  toEqualOneOf (expectedPossibilities) {
      for (var i = 0; i < expectedPossibilities.length; i++) {
          if (this.env.equals_(this.actual, expectedPossibilities[i])) {
              return true;
          }
      }
      return false;
  },

  toContainHtml (expectedHtml, postProcessCleanedHtml) {
      var cleanedHtml = this.actual.innerHTML.toLowerCase().replace(/\r\n/g, "");
      // IE < 9 strips whitespace immediately following comment nodes. Normalize by doing the same on all browsers.
      cleanedHtml = cleanedHtml.replace(/(<!--.*?-->)\s*/g, "$1");
      expectedHtml = expectedHtml.replace(/(<!--.*?-->)\s*/g, "$1");
      // Also remove __ko__ expando properties (for DOM data) - most browsers hide these anyway but IE < 9 includes them in innerHTML
      cleanedHtml = cleanedHtml.replace(/ __ko__\d+=\"(ko\d+|null)\"/g, "");
      if (postProcessCleanedHtml) {
          cleanedHtml = postProcessCleanedHtml(cleanedHtml);
      }
      this.actual = cleanedHtml;      // Fix explanatory message
      return cleanedHtml === expectedHtml;
  }
}

//
// bmh: Monkeypatch so we can catch errors in asynchronous functions.
//
jasmine.FakeTimer.prototype.runFunctionsWithinRange = function(oldMillis, nowMillis) {
    var scheduledFunc;
    var funcsToRun = new Array();
    for (var timeoutKey in this.scheduledFunctions) {
        scheduledFunc = this.scheduledFunctions[timeoutKey];
        if (scheduledFunc != jasmine.undefined &&
            scheduledFunc.runAtMillis >= oldMillis &&
            scheduledFunc.runAtMillis <= nowMillis) {
            funcsToRun.push(scheduledFunc);
            this.scheduledFunctions[timeoutKey] = jasmine.undefined;
        }
    }

    if (funcsToRun.length > 0) {
        funcsToRun.sort(function(a : any, b : any) {
            return a.runAtMillis - b.runAtMillis;
        });

        for (var i = 0; i < funcsToRun.length; ++i) {
          //try {       // mbest: Removed so we can catch errors in asynchronous functions
            var funcToRun = funcsToRun[i];
            this.nowMillis = funcToRun.runAtMillis;
            funcToRun.funcToCall();
            if (funcToRun.recurring) {
                this.scheduleFunction(funcToRun.timeoutKey,
                  funcToRun.funcToCall,
                  funcToRun.millis,
                  true);
            }
          //} catch(e) {
          //}
        }
        this.runFunctionsWithinRange(oldMillis, nowMillis);
    }
};

beforeEach(function() {
    this.addMatchers(matchers);
});
