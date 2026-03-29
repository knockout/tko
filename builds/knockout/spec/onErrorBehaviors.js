describe('onError handler', function () {
    var koOnErrorCount = 0;
    var windowOnErrorCount = 0;
    var windowOnErrorOriginal;
    var lastSeenError = null;
    const originalOnError = ko.options.onError

    function waitFor(condition, timeoutMs) {
        timeoutMs = timeoutMs || 100;
        return new Promise(function (resolve, reject) {
            var deadline = Date.now() + timeoutMs;

            function poll() {
                if (condition()) {
                    resolve();
                    return;
                }

                if (Date.now() >= deadline) {
                    reject(new Error('Timed out waiting for async error handling'));
                    return;
                }

                setTimeout(poll, 1);
            }

            poll();
        });
    }

    beforeEach(function () {
        this.restoreAfter(ko.options, 'taskScheduler');
        ko.options.taskScheduler = function (callback) {
            setTimeout(callback, 0);
        };

        ko.options.onError = function (error) {
            lastSeenError = error;
            koOnErrorCount++;
            throw error
        };

        function ensureNodeExistsAndIsEmpty(id, tagName, type) {
            var existingNode = document.getElementById(id);
            if (existingNode != null)
                existingNode.parentNode.removeChild(existingNode);
            var resultNode = document.createElement(tagName || "div");
            resultNode.id = id;
            if (type)
                resultNode.setAttribute("type", type);
            document.body.appendChild(resultNode);
            return resultNode;
        }

        window.testDivTemplate = ensureNodeExistsAndIsEmpty("testDivTemplate");
        window.templateOutput = ensureNodeExistsAndIsEmpty("templateOutput");

        koOnErrorCount = 0;
        windowOnErrorCount = 0;

        windowOnErrorOriginal = window.onerror;

        window.onerror = function () {
            windowOnErrorCount++;

            // Don't spam the console, since these were triggered deliberately
            // Annoyingly, Phantom interprets this return value backwardly, treating 'false'
            // to mean 'suppress', when browsers all use 'true' to mean 'suppress'.
            var isPhantom = !!window._phantom;
            return isPhantom ? false : true;
        };
    });

    afterEach(function () {
        window.onerror = windowOnErrorOriginal;
        ko.options.onError = originalOnError;
        lastSeenError = null;
    });

    it('does not fire on sync errors', function () {
        window.testDivTemplate.innerHTML = "name: <div data-bind='text: name'></div>";

        var syncError = false;

        try {
            ko.renderTemplate("testDivTemplate", {
                name: ko.computed(function () {
                    return ERRORS_ON_PURPOSE = ERRORS_ON_PURPOSE2;
                })
            }, null, window.templateOutput);
        }
        catch (e) {
            syncError = true;
        }

        expect(syncError).toBe(true);

        expect(koOnErrorCount).toBe(0);
        expect(windowOnErrorCount).toBe(0);
    });

    it('fires on async component errors', async function () {
        var component = {
            tagName: 'test-onerror',
            template: "<div data-bind='text: name'></div>",
            viewModel: function () {
                this.name = ko.computed(function () {
                    return ERRORS_ON_PURPOSE = ERRORS_ON_PURPOSE2;
                });
            }
        };

        if (!ko.components.isRegistered(component.tagName)) {
            ko.components.register(component.tagName, component);
        }

        window.testDivTemplate.innerHTML = "<test-onerror></test-onerror>";
        ko.renderTemplate("testDivTemplate", {
        }, null, window.templateOutput);

        await waitFor(function () {
            return koOnErrorCount > 0 && windowOnErrorCount > 0;
        });
        expect(koOnErrorCount).toBe(1);
        expect(windowOnErrorCount).toBe(1);
    });

    it('passes through the error instance', async function() {
        var expectedInstance;
        ko.tasks.schedule(function() {
            expectedInstance = new Error('Some error');
            throw expectedInstance;
        });

        await waitFor(function () {
            return koOnErrorCount > 0;
        });
        expect(koOnErrorCount).toBe(1);
        expect(windowOnErrorCount).toBe(1);
        expect(lastSeenError).toBe(expectedInstance);
    });
});
