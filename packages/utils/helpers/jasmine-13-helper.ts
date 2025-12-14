/// <reference types="jasmine" />

import jQuery from "jquery";
window.jQuery = jQuery;

/*
 * Configure the Jasmine testing framework.
 */
 /* globals runs, waitsFor, jasmine */
 
import {
  arrayMap, arrayFilter, ieVersion, selectExtensions, hasOwnProperty, options
} from '../dist/'

window.DEBUG = true;
window.amdRequire = window.require;

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
    const existingNode = document.getElementById("testNode");
    if (existingNode !== null && existingNode.parentNode)
        existingNode.parentNode.removeChild(existingNode);
    const testNode = document.createElement("div");
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
    const originalValue = object[propertyName];
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
    if('textContent' in node) {
        node.textContent = text 
     } else { 
        node.innerText = text
     }
};


function cleanedHtml(node) {
    let cleanedHtml = node.innerHTML.toLowerCase().replace(/\r\n/g, "");
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
const matchers = {

    toHaveNodeTypes  (expectedTypes) {
        const values = arrayMap(this.actual, function (node) {
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

      const actualText = jasmine.nodeText(this.actual);
      let cleanedActualText = actualText.replace(/\r\n/g, "\n");
      if (ignoreSpaces) {
          cleanedActualText = cleanedActualText.replace(/\s/g, "");
      }

      this.actual = cleanedActualText;    // Fix explanatory message
      return cleanedActualText === expectedText;
  },

  toHaveOwnProperties (expectedProperties) {
      const ownProperties = new Array();
      for (const prop in this.actual) {
          if (hasOwnProperty(this.actual, prop)) {
              ownProperties.push(prop);
          }
      }
      return this.env.equals_(ownProperties, expectedProperties);
  },

  toHaveTexts (expectedTexts) {
      const texts = arrayMap(this.actual.childNodes, jasmine.nodeText);
      this.actual = texts;   // Fix explanatory message
      return this.env.equals_(texts, expectedTexts);
  },

  toHaveValues (expectedValues) {
      const values = arrayFilter(
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
      let exception;
      try {
          this.actual();
      } catch (e) {
          exception = e;
      }
      const exceptionMessage = exception && (exception.message || exception);

      this.message = function () {
          const notText = this.isNot ? " not" : "";
          const expectation = "Expected " + this.actual.toString() + notText + " to throw exception containing '" + expected + "'";
          const result = exception ? (", but it threw '" + exceptionMessage + "'") : ", but it did not throw anything";
          return expectation + result;
      };

      return exception ? this.env.contains_(exceptionMessage, expected) : false;
  },

  toEqualOneOf (expectedPossibilities) {
      for (let i = 0; i < expectedPossibilities.length; i++) {
          if (this.env.equals_(this.actual, expectedPossibilities[i])) {
              return true;
          }
      }
      return false;
  },

  toContainHtml (expectedHtml, postProcessCleanedHtml) {
      let cleanedHtml = this.actual.innerHTML.toLowerCase().replace(/\r\n/g, "");
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
  },

  toHaveSelectedValues (expectedValues) {
    const selectedNodes = arrayFilter(this.actual.childNodes, node => node.selected)
    const selectedValues = arrayMap(selectedNodes, node => selectExtensions.readValue(node))
    this.actual = selectedValues   // Fix explanatory message
    return this.env.equals_(selectedValues, expectedValues)
  }
}

//
// bmh: Monkeypatch so we can catch errors in asynchronous functions.
//
jasmine.FakeTimer.prototype.runFunctionsWithinRange = function(oldMillis, nowMillis) {
    let scheduledFunc;
    const funcsToRun = new Array();
    for (const timeoutKey in this.scheduledFunctions) {
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

        for (let i = 0; i < funcsToRun.length; ++i) {
          //try {       // mbest: Removed so we can catch errors in asynchronous functions
            const funcToRun = funcsToRun[i];
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

    switchJQueryState();
});

afterEach(function() {
    expect(disableJQueryUsage).toEqual(options.disableJQueryUsage);
})

const KARMA_STRING = '__karma__'
var disableJQueryUsage = true;
function switchJQueryState() {
    if (window[KARMA_STRING] && window[KARMA_STRING].config.args.includes('--noJQuery')) {
        options.disableJQueryUsage = disableJQueryUsage = true;
    } else {
        options.disableJQueryUsage = disableJQueryUsage = false;
    }
}

