import {
    options, tasks
} from '../dist'

describe('onError handler', function () {
  var koOnErrorCount = 0
  var windowOnErrorCount = 0
  var windowOnErrorOriginal = window.onerror
  var optionsOnErrorOriginal = options.onError
  var lastSeenError = null

  beforeEach(function () {
    options.onError = function (error) {
      lastSeenError = error
      koOnErrorCount++
    }

    function ensureNodeExistsAndIsEmpty (id:string, tagName?:string, type?:string):HTMLElement {
      var existingNode = document.getElementById(id)
      if (existingNode != null) { existingNode.parentNode?.removeChild(existingNode) }
      var resultNode = document.createElement(tagName || 'div')
      resultNode.id = id
      if (type) { resultNode.setAttribute('type', type) }
      document.body.appendChild(resultNode)
      return resultNode
    }

    ;(window as any).testDivTemplate = ensureNodeExistsAndIsEmpty('testDivTemplate')
    ;(window as any).templateOutput = ensureNodeExistsAndIsEmpty('templateOutput')

    koOnErrorCount = 0
    windowOnErrorCount = 0

    window.onerror = function () {
      windowOnErrorCount++

            // Don't spam the console, since these were triggered deliberately
            // Annoyingly, Phantom interprets this return value backwardly, treating 'false'
            // to mean 'suppress', when browsers all use 'true' to mean 'suppress'.
      var isPhantom = !!(window as any)._phantom
      return !isPhantom
    }
  })

  afterEach(function () {
    window.onerror = windowOnErrorOriginal
    options.onError = optionsOnErrorOriginal
    lastSeenError = null
  })

    // FIXME
    // it('does not fire on sync errors', function () {
    //     window.testDivTemplate.innerHTML = "name: <div data-bind='text: name'></div>";
    //
    //     var syncError = false;
    //
    //     try {
    //         ko.renderTemplate("testDivTemplate", {
    //             name: ko.computed(function () {
    //                 return ERRORS_ON_PURPOSE = ERRORS_ON_PURPOSE2;
    //             })
    //         }, null, window.templateOutput);
    //     }
    //     catch (e) {
    //         syncError = true;
    //     }
    //
    //     expect(syncError).toBe(true);
    //
    //     expect(koOnErrorCount).toBe(0);
    //     expect(windowOnErrorCount).toBe(0);
    // });
    //
    // it('fires on async component errors', function () {
    //     runs(function () {
    //         var component = {
    //             tagName: 'test-onerror',
    //             template: "<div data-bind='text: name'></div>",
    //             viewModel: function () {
    //                 this.name = ko.computed(function () {
    //                     return ERRORS_ON_PURPOSE = ERRORS_ON_PURPOSE2;
    //                 });
    //             }
    //         };
    //
    //         if (!ko.components.isRegistered(component.tagName)) {
    //             ko.components.register(component.tagName, component);
    //         }
    //
    //         window.testDivTemplate.innerHTML = "<test-onerror></test-onerror>";
    //         ko.renderTemplate("testDivTemplate", {
    //         }, null, window.templateOutput);
    //     });
    //
    //     waitsFor(function () {
    //         return koOnErrorCount > 0 && windowOnErrorCount > 0;
    //     }, 'Error counts were not updated', 500);
    //
    //     runs(function () {
    //         expect(koOnErrorCount).toBe(1);
    //         expect(windowOnErrorCount).toBe(1);
    //     });
    // });

  it('does not re-throw the error', function () {
    var expectedInstance
    tasks.schedule(function () {
      expectedInstance = new Error('Some error')
      throw expectedInstance
    })

    waitsFor(function () {
      return koOnErrorCount > 0
    })

    runs(function () {
      expect(koOnErrorCount).toBe(1)
      expect(windowOnErrorCount).toBe(0)
      expect(lastSeenError).toBe(expectedInstance)
    })
  })
})
