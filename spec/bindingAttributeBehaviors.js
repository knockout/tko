import {
    domData, cleanNode, options
} from 'tko.utils';

import {
    observable as koObservable
} from 'tko.observable';

import {
    bindingHandlers, applyBindings, bindingProvider, dataFor,
    applyBindingsToDescendants, applyBindingsToNode, contextFor
} from '../index.js';

import '../node_modules/tko.utils/helpers/jasmine-13-helper.js';

import '../node_modules/tko.utils/helpers/jasmine-13-helper.js';


/* eslint semi: 0, no-empty: 0 */
describe('Binding attribute syntax', function() {
    beforeEach(jasmine.prepareTestNode);

    it('applyBindings should accept no parameters and then act on document.body with undefined model', function() {
        this.after(function () { domData.clear(document.body); });     // Just to avoid interfering with other specs

        var didInit = false;
        bindingHandlers.test = {
            init: function (element, valueAccessor, allBindings, viewModel) {
                expect(element.id).toEqual("testElement");
                expect(viewModel).toEqual(undefined);
                didInit = true;
            }
        };
        testNode.innerHTML = "<div id='testElement' data-bind='test:123'></div>";
        applyBindings();
        expect(didInit).toEqual(true);
    });

    it('applyBindings should accept one parameter and then act on document.body with parameter as model', function() {
        this.after(function () { domData.clear(document.body); });     // Just to avoid interfering with other specs

        var didInit = false;
        var suppliedViewModel = {};
        bindingHandlers.test = {
            init: function (element, valueAccessor, allBindings, viewModel) {
                expect(element.id).toEqual("testElement");
                expect(viewModel).toEqual(suppliedViewModel);
                didInit = true;
            }
        };
        testNode.innerHTML = "<div id='testElement' data-bind='test:123'></div>";
        applyBindings(suppliedViewModel);
        expect(didInit).toEqual(true);
    });

    it('applyBindings should accept two parameters and then act on second param as DOM node with first param as model', function() {
        var didInit = false;
        var suppliedViewModel = {};
        bindingHandlers.test = {
            init: function (element, valueAccessor, allBindings, viewModel) {
                expect(element.id).toEqual("testElement");
                expect(viewModel).toEqual(suppliedViewModel);
                didInit = true;
            }
        };
        testNode.innerHTML = "<div id='testElement' data-bind='test:123'></div>";

        var shouldNotMatchNode = document.createElement("DIV");
        shouldNotMatchNode.innerHTML = "<div id='shouldNotMatchThisElement' data-bind='test:123'></div>";
        document.body.appendChild(shouldNotMatchNode);
        this.after(function () { document.body.removeChild(shouldNotMatchNode); });

        applyBindings(suppliedViewModel, testNode);
        expect(didInit).toEqual(true);
    });

    it('Should tolerate empty or only white-space binding strings', function() {
        testNode.innerHTML = "<div data-bind=''></div><div data-bind='   '></div>";
        applyBindings(null, testNode); // No exception means success
    });

    it('Should tolerate whitespace and nonexistent handlers', function () {
        testNode.innerHTML = "<div data-bind=' nonexistentHandler : \"Hello\" '></div>";
        applyBindings(null, testNode); // No exception means success
    });

    it('Should tolerate arbitrary literals as the values for a handler', function () {
        testNode.innerHTML = "<div data-bind='stringLiteral: \"hello\", numberLiteral: 123, boolLiteralTrue: true, boolLiteralFalse: false, objectLiteral: {}, functionLiteral: function() { }, nullLiteral: null, undefinedLiteral: undefined'></div>";
        applyBindings(null, testNode); // No exception means success
    });

    it('Should tolerate wacky IE conditional comments', function() {
        // Represents issue https://github.com/SteveSanderson/knockout/issues/186. Would fail on IE9, but work on earlier IE versions.
        testNode.innerHTML = "<div><!--[if IE]><!-->Hello<!--<![endif]--></div>";
        applyBindings(null, testNode); // No exception means success
    });

    it('Should produce a meaningful error if a binding value contains invalid JavaScript', function() {
        bindingHandlers.test = {
            init: function (element, valueAccessor) { valueAccessor(); }
        };
        testNode.innerHTML = "<div data-bind='test: (1;2)'></div>";
        expect(function () {
            applyBindings(null, testNode);
        }).toThrowContaining("Unable to parse bindings.\nBindings value: test: (1;2)\nMessage:");
    });

    it('Should produce a meaningful error if a binding value doesn\'t exist', function() {
        bindingHandlers.test = {
            init: function (element, valueAccessor) { valueAccessor(); }
        };
        testNode.innerHTML = "<div data-bind='test: nonexistentValue'></div>";
        expect(function () {
            applyBindings(null, testNode);
        }).toThrowContaining("nonexistentValue");
    });

    it("Should call onBindingError with relevant details of a bindingHandler init error", function () {
        var saved_obe = options.onError,
            obe_calls = 0;
        this.after(function () {
            options.onError = saved_obe;
        })
        options.onError = function (spec) {
            obe_calls++;
            expect(spec.during).toEqual('init');
            expect(spec.errorCaptured.message).toEqual('A moth!');
            expect(spec.bindingKey).toEqual('test')
            expect(spec.valueAccessor()).toEqual(64728)
            expect(spec.element).toEqual(testNode.children[0])
            expect(spec.bindings.test()).toEqual(64728)
            expect(spec.bindingContext.$data).toEqual('0xe')
            expect(spec.allBindings().test).toEqual(64728)
        }
        bindingHandlers.test = {
            init: function () { throw new Error("A moth!") }
        }
        testNode.innerHTML = "<div data-bind='test: 64728'></div>";
        applyBindings('0xe', testNode);
        expect(obe_calls).toEqual(1);
    });

    it("Should call onBindingError with relevant details of a bindingHandler update error", function () {
        var saved_obe = options.onError,
            obe_calls = 0;
        this.after(function () {
            options.onError = saved_obe;
        })
        options.onError = function (spec) {
            obe_calls++;
            expect(spec.during).toEqual('update');
            expect(spec.errorCaptured.message).toEqual('A beetle!');
            expect(spec.bindingKey).toEqual('test')
            expect(spec.valueAccessor()).toEqual(64729)
            expect(spec.element).toEqual(testNode.children[0])
            expect(spec.bindings.test()).toEqual(64729)
            expect(spec.bindingContext.$data).toEqual('0xf')
            expect(spec.allBindings().test).toEqual(64729)
        }
        bindingHandlers.test = {
            update: function () { throw new Error("A beetle!") }
        }
        testNode.innerHTML = "<div data-bind='test: 64729'></div>";
        applyBindings('0xf', testNode);
        expect(obe_calls).toEqual(1);
    });

    it("Should call onBindingError with relevant details when an update fails", function () {
        var saved_obe = options.onError,
            obe_calls = 0,
            observable = koObservable();
        this.after(function () {
            options.onError = saved_obe;
        });

        options.onError = function (spec) {
            obe_calls++;
            expect(spec.during).toEqual('update');
            expect(spec.errorCaptured.message).toEqual('Observable: 42');
            expect(spec.bindingKey).toEqual('test');
            expect(spec.valueAccessor()).toEqual(64725);
            expect(spec.element).toEqual(testNode.children[0]);
            expect(spec.bindings.test()).toEqual(64725);
            expect(spec.bindingContext.$data).toEqual('0xef');
            expect(spec.allBindings().test).toEqual(64725);
        };

        bindingHandlers.test = {
            update: function () {
                if (observable() === 42) {
                    throw new Error("Observable: " + observable());
                }
            }
        };
        testNode.innerHTML = "<div data-bind='test: 64725'></div>";
        applyBindings('0xef', testNode);
        expect(obe_calls).toEqual(0);
        try { observable(42); } catch (e) {}
        expect(obe_calls).toEqual(1);
        observable(24);
        expect(obe_calls).toEqual(1);
        try { observable(42); } catch (e) {}
        expect(obe_calls).toEqual(2);
    });

    it("Calls options.onError, if it is defined", function () {
        var oe_calls = 0
        var oxy = koObservable()
        this.after(function () { options.onError = undefined })
        options.onError = function (err) {
            expect(err.message.indexOf('turtle')).toNotEqual(-1)
            // Check for the `spec` properties
            expect(err.bindingKey).toEqual('test')
            oe_calls++
        }
        bindingHandlers.test = {
            init: function () { throw new Error("A turtle!") },
            update: function (e, oxy) {
                ko.unwrap(oxy());  // Create dependency.
                throw new Error("Two turtles!")
            }
        }
        testNode.innerHTML = "<div data-bind='test: oxy'></div>";
        applyBindings({oxy: oxy}, testNode);
        expect(oe_calls).toEqual(2)
        oxy(1234)
        expect(oe_calls).toEqual(3)
    })


    it('Should invoke registered handlers\'s init() then update() methods passing binding data', function () {
        var methodsInvoked = [];
        bindingHandlers.test = {
            init: function (element, valueAccessor, allBindings) {
                methodsInvoked.push("init");
                expect(element.id).toEqual("testElement");
                expect(valueAccessor()).toEqual("Hello");
                expect(allBindings.get('another')).toEqual(123);
            },
            update: function (element, valueAccessor, allBindings) {
                methodsInvoked.push("update");
                expect(element.id).toEqual("testElement");
                expect(valueAccessor()).toEqual("Hello");
                expect(allBindings.get('another')).toEqual(123);
            }
        }
        testNode.innerHTML = "<div id='testElement' data-bind='test:\"Hello\", another:123'></div>";
        applyBindings(null, testNode);
        expect(methodsInvoked.length).toEqual(2);
        expect(methodsInvoked[0]).toEqual("init");
        expect(methodsInvoked[1]).toEqual("update");
    });

    it('Should invoke each handlers\'s init() and update() before running the next one', function () {
        var methodsInvoked = [];
        bindingHandlers.test1 = bindingHandlers.test2 = {
            init: function (element, valueAccessor) {
                methodsInvoked.push("init" + valueAccessor());
            },
            update: function (element, valueAccessor) {
                methodsInvoked.push("update" + valueAccessor());
            }
        };
        testNode.innerHTML = "<div data-bind='test1:\"1\", test2:\"2\"'></div>";
        applyBindings(null, testNode);
        expect(methodsInvoked).toEqual(['init1', 'update1', 'init2', 'update2']);
    });

    it('Should be able to use $element in binding value', function() {
        testNode.innerHTML = "<div data-bind='text: $element.tagName'></div>";
        applyBindings({}, testNode);
        expect(testNode).toContainText("DIV");
    });

    it('Should be able to use $context in binding value to refer to the context object', function() {
        testNode.innerHTML = "<div data-bind='text: $context.$data === $data'></div>";
        applyBindings({}, testNode);
        expect(testNode).toContainText("true");
    });

    it('Should be able to refer to the bound object itself (at the root scope, the viewmodel) via $data', function() {
        testNode.innerHTML = "<div data-bind='text: $data.someProp'></div>";
        applyBindings({ someProp: 'My prop value' }, testNode);
        expect(testNode).toContainText("My prop value");
    });

    it('Bindings can signal that they control descendant bindings by returning a flag from their init function', function() {
        bindingHandlers.test = {
            init: function() { return { controlsDescendantBindings : true } }
        };
        testNode.innerHTML = "<div data-bind='test: true'>"
                           +     "<div data-bind='text: 123'>456</div>"
                           + "</div>"
                           + "<div data-bind='text: 123'>456</div>";
        applyBindings(null, testNode);

        expect(testNode.childNodes[0].childNodes[0].innerHTML).toEqual("456");
        expect(testNode.childNodes[1].innerHTML).toEqual("123");
    });

    it('Should not be allowed to have multiple bindings on the same element that claim to control descendant bindings', function() {
        bindingHandlers.test1 = {
            init: function() { return { controlsDescendantBindings : true } }
        };
        bindingHandlers.test2 = bindingHandlers.test1;
        testNode.innerHTML = "<div data-bind='test1: true, test2: true'></div>"
        expect(function () {
            applyBindings(null, testNode);
        }).toThrowContaining("Multiple bindings (test1 and test2) are trying to control descendant bindings of the same element.");
    });

    it('Should use properties on the view model in preference to properties on the binding context', function() {
        testNode.innerHTML = "<div data-bind='text: $data.someProp'></div>";
        applyBindings({ '$data': { someProp: 'Inner value'}, someProp: 'Outer value' }, testNode);
        expect(testNode).toContainText("Inner value");
    });

    it('Should be able to extend a binding context, adding new custom properties, without mutating the original binding context', function() {
        bindingHandlers.addCustomProperty = {
            init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
                applyBindingsToDescendants(bindingContext.extend({ '$customProp': 'my value' }), element);
                return { controlsDescendantBindings : true };
            }
        };
        testNode.innerHTML = "<div data-bind='with: sub'><div data-bind='addCustomProperty: true'><div data-bind='text: $customProp'></div></div></div>";
        var vm = { sub: {} };
        applyBindings(vm, testNode);
        expect(testNode).toContainText("my value");
        expect(contextFor(testNode.childNodes[0].childNodes[0].childNodes[0]).$customProp).toEqual("my value");
        expect(contextFor(testNode.childNodes[0].childNodes[0]).$customProp).toEqual(undefined); // Should not affect original binding context

        // vale of $data and $parent should be unchanged in extended context
        expect(contextFor(testNode.childNodes[0].childNodes[0].childNodes[0]).$data).toEqual(vm.sub);
        expect(contextFor(testNode.childNodes[0].childNodes[0].childNodes[0]).$parent).toEqual(vm);
    });

    it('Binding contexts should inherit any custom properties from ancestor binding contexts', function() {
        bindingHandlers.addCustomProperty = {
            init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
                applyBindingsToDescendants(bindingContext.extend({ '$customProp': 'my value' }), element);
                return { controlsDescendantBindings : true };
            }
        };
        testNode.innerHTML = "<div data-bind='addCustomProperty: true'><div data-bind='with: true'><div data-bind='text: $customProp'></div></div></div>";
        applyBindings(null, testNode);
        expect(testNode).toContainText("my value");
    });

    it('Should be able to retrieve the binding context associated with any node', function() {
        testNode.innerHTML = "<div><div data-bind='text: name'></div></div>";
        applyBindings({ name: 'Bert' }, testNode.childNodes[0]);

        expect(testNode.childNodes[0].childNodes[0]).toContainText("Bert");

        // Can't get binding context for unbound nodes
        expect(dataFor(testNode)).toEqual(undefined);
        expect(contextFor(testNode)).toEqual(undefined);

        // Can get binding context for directly bound nodes
        expect(dataFor(testNode.childNodes[0]).name).toEqual("Bert");
        expect(contextFor(testNode.childNodes[0]).$data.name).toEqual("Bert");

        // Can get binding context for descendants of directly bound nodes
        expect(dataFor(testNode.childNodes[0].childNodes[0]).name).toEqual("Bert");
        expect(contextFor(testNode.childNodes[0].childNodes[0]).$data.name).toEqual("Bert");
    });

    it('Should not be allowed to use containerless binding syntax for bindings other than whitelisted ones', function() {
        testNode.innerHTML = "Hello <!-- ko visible: false -->Some text<!-- /ko --> Goodbye"
        expect(function () {
            applyBindings(null, testNode);
        }).toThrow("The binding 'visible' cannot be used with virtual elements");
    });

    it('Should be able to set a custom binding to use containerless binding', function() {
        var initCalls = 0;
        bindingHandlers.test = { init: function () { initCalls++ } };
        ko.virtualElements.allowedBindings['test'] = true;

        testNode.innerHTML = "Hello <!-- ko test: false -->Some text<!-- /ko --> Goodbye";
        applyBindings(null, testNode);

        expect(initCalls).toEqual(1);
        expect(testNode).toContainText("Hello Some text Goodbye");
    });

    it('Should be allowed to express containerless bindings with arbitrary internal whitespace and newlines', function() {
        testNode.innerHTML = "Hello <!-- ko\n" +
                             "    with\n" +
                             "      : \n "+
                             "        { \n" +
                             "           \tpersonName: 'Bert'\n" +
                             "        }\n" +
                             "   \t --><span data-bind='text: personName'></span><!-- \n" +
                             "     /ko \n" +
                             "-->, Goodbye";
        applyBindings(null, testNode);
        expect(testNode).toContainText('Hello Bert, Goodbye');
    });

    it('Should be able to access virtual children in custom containerless binding', function() {
        var countNodes = 0;
        bindingHandlers.test = {
            init: function (element /*, valueAccessor */) {
                // Counts the number of virtual children, and overwrites the text contents of any text nodes
                for (var node = ko.virtualElements.firstChild(element); node; node = ko.virtualElements.nextSibling(node)) {
                    countNodes++;
                    if (node.nodeType === 3)
                        node.data = 'new text';
                }
            }
        };
        ko.virtualElements.allowedBindings['test'] = true;

        testNode.innerHTML = "Hello <!-- ko test: false -->Some text<!-- /ko --> Goodbye"
        applyBindings(null, testNode);

        expect(countNodes).toEqual(1);
        expect(testNode).toContainText("Hello new text Goodbye");
    });

    it('Should only bind containerless binding once inside template', function() {
        var initCalls = 0;
        bindingHandlers.test = { init: function () { initCalls++ } };
        ko.virtualElements.allowedBindings['test'] = true;

        testNode.innerHTML = "Hello <!-- ko if: true --><!-- ko test: false -->Some text<!-- /ko --><!-- /ko --> Goodbye"
        applyBindings(null, testNode);

        expect(initCalls).toEqual(1);
        expect(testNode).toContainText("Hello Some text Goodbye");
    });

    it('Bindings in containerless binding in templates should be bound only once', function() {
        delete bindingHandlers.nonexistentHandler;
        var initCalls = 0;
        bindingHandlers.test = { init: function () { initCalls++; } };
        testNode.innerHTML = "<div data-bind='template: {\"if\":true}'>xxx<!-- ko nonexistentHandler: true --><span data-bind='test: true'></span><!-- /ko --></div>";
        applyBindings({}, testNode);
        expect(initCalls).toEqual(1);
    });

    it('Should automatically bind virtual descendants of containerless markers if no binding controlsDescendantBindings', function() {
        testNode.innerHTML = "Hello <!-- ko dummy: false --><span data-bind='text: \"WasBound\"'>Some text</span><!-- /ko --> Goodbye";
        applyBindings(null, testNode);
        expect(testNode).toContainText("Hello WasBound Goodbye");
    });

    it('Should be able to set and access correct context in custom containerless binding', function() {
        bindingHandlers.bindChildrenWithCustomContext = {
            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var innerContext = bindingContext.createChildContext({ myCustomData: 123 });
                applyBindingsToDescendants(innerContext, element);
                return { 'controlsDescendantBindings': true };
            }
        };
        ko.virtualElements.allowedBindings['bindChildrenWithCustomContext'] = true;

        testNode.innerHTML = "Hello <!-- ko bindChildrenWithCustomContext: true --><div>Some text</div><!-- /ko --> Goodbye"
        applyBindings(null, testNode);

        expect(dataFor(testNode.childNodes[2]).myCustomData).toEqual(123);
    });

    it('Should be able to set and access correct context in nested containerless binding', function() {
        delete bindingHandlers.nonexistentHandler;
        bindingHandlers.bindChildrenWithCustomContext = {
            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var innerContext = bindingContext.createChildContext({ myCustomData: 123 });
                applyBindingsToDescendants(innerContext, element);
                return { 'controlsDescendantBindings': true };
            }
        };

        testNode.innerHTML = "Hello <div data-bind='bindChildrenWithCustomContext: true'><!-- ko nonexistentHandler: 123 --><div>Some text</div><!-- /ko --></div> Goodbye"
        applyBindings(null, testNode);

        expect(dataFor(testNode.childNodes[1].childNodes[0]).myCustomData).toEqual(123);
        expect(dataFor(testNode.childNodes[1].childNodes[1]).myCustomData).toEqual(123);
    });

    it('Should be able to access custom context variables in child context', function() {
        bindingHandlers.bindChildrenWithCustomContext = {
            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var innerContext = bindingContext.createChildContext({ myCustomData: 123 });
                innerContext.customValue = 'xyz';
                applyBindingsToDescendants(innerContext, element);
                return { 'controlsDescendantBindings': true };
            }
        };

        testNode.innerHTML = "Hello <div data-bind='bindChildrenWithCustomContext: true'><!-- ko with: myCustomData --><div>Some text</div><!-- /ko --></div> Goodbye"
        applyBindings(null, testNode);

        expect(contextFor(testNode.childNodes[1].childNodes[0]).customValue).toEqual('xyz');
        expect(dataFor(testNode.childNodes[1].childNodes[1])).toEqual(123);
        expect(contextFor(testNode.childNodes[1].childNodes[1]).$parent.myCustomData).toEqual(123);
        expect(contextFor(testNode.childNodes[1].childNodes[1]).$parentContext.customValue).toEqual('xyz');
    });

    it('Should be able to use value-less binding in containerless binding', function() {
        var initCalls = 0;
        bindingHandlers.test = { init: function () { initCalls++ } };
        ko.virtualElements.allowedBindings['test'] = true;

        testNode.innerHTML = "Hello <!-- ko test -->Some text<!-- /ko --> Goodbye";
        applyBindings(null, testNode);

        expect(initCalls).toEqual(1);
        expect(testNode).toContainText("Hello Some text Goodbye");
    });

    it('Should not allow multiple applyBindings calls for the same element', function() {
        testNode.innerHTML = "<div data-bind='text: \"Some Text\"'></div>";

        // First call is fine
        applyBindings({}, testNode);

        // Second call throws an error
        expect(function () {
            applyBindings({}, testNode);
        }).toThrow("You cannot apply bindings multiple times to the same element.");
    });

    it('Should allow multiple applyBindings calls for the same element if cleanNode is used', function() {
        testNode.innerHTML = "<div data-bind='text: \"Some Text\"'></div>";

        // First call
        applyBindings({}, testNode);

        // cleanNode called before second call
        cleanNode(testNode);
        applyBindings({}, testNode);
        // Should not throw any errors
    });

    it('Should allow multiple applyBindings calls for the same element if subsequent call provides a binding', function() {
        testNode.innerHTML = "<div data-bind='text: \"Some Text\"'></div>";

        // First call uses data-bind
        applyBindings({}, testNode);

        // Second call provides a binding
        applyBindingsToNode(testNode, { visible: false }, {});
        // Should not throw any errors
    });

    it('Should allow multiple applyBindings calls for the same element if initial call provides a binding', function() {
        testNode.innerHTML = "<div data-bind='text: \"Some Text\"'></div>";

        // First call provides a binding
        applyBindingsToNode(testNode, { visible: false }, {});

        // Second call uses data-bind
        applyBindings({}, testNode);
        // Should not throw any errors
    });

    describe('Should not bind against text content inside restricted elements', function() {
        this.beforeEach(function() {
            this.restoreAfter(bindingProvider, 'instance');

            // Developers won't expect or want binding to mutate the contents of <script> or <textarea>
            // elements. Historically this wasn't a problem because the default binding provider only
            // acts on elements, but now custom providers can act on text contents of elements, it's
            // important to ensure we don't break these elements by mutating their contents.

            // First replace the binding provider with one that's hardcoded to replace all text
            // content with a special message, via a binding handler that operates on text nodes

            var originalBindingProvider = bindingProvider.instance;
            bindingProvider.instance = {
                nodeHasBindings: function(node) {
                    // IE < 9 can't bind text nodes, as expando properties are not allowed on them.
                    // This will still prove that the binding provider was not executed on the children of a restricted element.
                    if (node.nodeType === 3 && jasmine.ieVersion < 9) {
                        node.data = "replaced";
                        return false;
                    }

                    return true;
                },
                getBindingAccessors: function(node, bindingContext) {
                    if (node.nodeType === 3) {
                        return {
                            replaceTextNodeContent: function() { return "replaced"; }
                        };
                    } else {
                        return originalBindingProvider.getBindingAccessors(node, bindingContext);
                    }
                }
            };
            bindingHandlers.replaceTextNodeContent = {
                update: function(textNode, valueAccessor) { textNode.data = valueAccessor(); }
            };
        });


        it('<script>', function() {
            testNode.innerHTML = "<p>Hello</p><script>alert(123);</script><p>Goodbye</p>";
            applyBindings({ sometext: 'hello' }, testNode);
            expect(testNode).toContainHtml('<p>replaced</p><script>alert(123);</script><p>replaced</p>');
        });


        it('<textarea>', function() {
            testNode.innerHTML = "<p>Hello</p><textarea>test</textarea><p>Goodbye</p>";
            applyBindings({ sometext: 'hello' }, testNode);
            expect(testNode).toContainHtml('<p>replaced</p><textarea>test</textarea><p>replaced</p>');
        });

        it('<template>', function() {
            document.createElement('template'); // For old IE
            testNode.innerHTML = "<p>Hello</p><template>test</template><p>Goodbye</p>";
            applyBindings({ sometext: 'hello' }, testNode);
            expect(testNode).toContainHtml('<p>replaced</p><template>test</template><p>replaced</p>');
        });
    });


    describe("Function binding handlers", function () {
        it("constructs the element with appropriate params", function () {
            var obj = { 'canary': 42 },
                viewModel = {param: obj};
            bindingHandlers.fnHandler = function (params) {
                expect(params.value).toEqual(obj)
                expect(params.element).toEqual(testNode.children[0])
                expect(params.$data).toEqual(viewModel)
                expect(params.$context).toEqual(
                    contextFor(testNode.children[0]))
                expect(params.allBindings()['bx']).toEqual(43)
                expect(params.allBindings.get('bx')).toEqual(43)
            }
            testNode.innerHTML = "<p data-bind='fnHandler: param, bx: 43'>";
            applyBindings(viewModel, testNode)
        });

        it("calls the `fn::dispose` when cleaned up", function () {
            var viewModel = { x: koObservable(true) },
                instance = null,
                disposeCalled = 0;
            bindingHandlers.fnHandler = function (/* params */) {
                instance = this;
            };
            bindingHandlers.fnHandler.prototype = {
                dispose: function () {
                    disposeCalled++;
                    expect(this).toEqual(instance);
                }
            };
            testNode.innerHTML = '<b data-bind="if: x"><i data-bind="fnHandler"></i></b>';
            applyBindings(viewModel, testNode);
            expect(disposeCalled).toEqual(0);
            viewModel.x(false);
            expect(disposeCalled).toEqual(1);
        });

        it("does not error without a `dispose` property", function () {
            var viewModel = { x: koObservable(true) };
            bindingHandlers.fnHandler = function (/* params */) {};
            testNode.innerHTML = '<b data-bind="if: x"><i data-bind="fnHandler"></i></b>';
            applyBindings(viewModel, testNode);
            viewModel.x(false);
        });

        it("virtual elements via fn::allowVirtualElements", function () {
            var called = 0
            bindingHandlers.fnHandler = function () { called++; };
            bindingHandlers.fnHandler.prototype = {
                allowVirtualElements: true
            };
            testNode.innerHTML = '<b><!-- ko fnHandler --><!-- /ko --></b>';
            applyBindings({}, testNode);
            expect(called).toEqual(1);
        });

        it("virtual elements via fn.allowVirtualElements", function () {
            var called = 0
            bindingHandlers.fnHandler = function () { called++};
            bindingHandlers.fnHandler.allowVirtualElements = true;
            testNode.innerHTML = '<b><!-- ko fnHandler --><!-- /ko --></b>';
            applyBindings({}, testNode);
            expect(called).toEqual(1);
        });

        it("errors when allowVirtualElements is not set", function () {
            var called = 0
            bindingHandlers.fnHandler = function () { called++; };
            testNode.innerHTML = '<b><!-- ko fnHandler --><!-- /ko --></b>';

            expect(function () {
                applyBindings({}, testNode);
            }).toThrowContaining("The binding 'fnHandler' cannot be used with virtual elements");
        });

        iit("has a .computed() property with the node's lifecycle", function () {
            var instance;
            var xCalls = 0,
                yCalls = 0;
            bindingHandlers.fnHandler = function () {
                var v = this.v = koObservable(0);
                instance = this;
                this.x = this.computed(function () {
                    xCalls++;
                    v();  // Add a dependency.
                    expect(this).toEqual(instance);
                    return 'x';
                });
                this.y = this.computed({
                    read: function () {
                        yCalls++;
                        v();
                        expect(this).toEqual(instance);
                        return 'y';
                    }
                });
            };
            testNode.innerHTML = '<i data-bind="fnHandler"></i>';
            applyBindings({}, testNode);
            expect(xCalls).toEqual(1);
            expect(yCalls).toEqual(1);
            expect(instance.x()).toEqual('x');
            expect(instance.y()).toEqual('y');
            expect(xCalls).toEqual(1);
            expect(yCalls).toEqual(1);
            instance.v(1);
            expect(xCalls).toEqual(2);
            expect(yCalls).toEqual(2);

            cleanNode(testNode);
            instance.v(2);
            // Re-computations have stopped.
            expect(xCalls).toEqual(2);
            expect(yCalls).toEqual(2);
        });

        it("has a .subscribe property with the node's lifecycle", function () {
            var obs = koObservable(),
                handlerInstance;
            bindingHandlers.fnHandler = function () {
                handlerInstance = this;
                this.subscribe(obs, this.cb);
            };
            bindingHandlers.fnHandler.prototype = {
                cb: function () {
                    expect(this).toEqual(handlerInstance);
                }
            };
            testNode.innerHTML = "<i data-bind='fnHandler'></i>";
            applyBindings({}, testNode);
            expect(obs.getSubscriptionsCount()).toEqual(1);
            cleanNode(testNode);
            expect(obs.getSubscriptionsCount()).toEqual(0);
        });
    });
});
