import {
    arrayForEach, domData, removeNode
} from 'tko.utils';

import {
    applyBindings
} from 'tko.bind';

import {
    observable, observableArray, isObservable
} from 'tko.observable';

import {
    Provider
} from 'tko.provider';

import {
    options
} from 'tko.utils';

import {
    bindings as templateBindings, renderTemplate,
    setTemplateEngine, nativeTemplateEngine
} from '../index.js';

import {bindings as coreBindings} from 'tko.binding.core';

import 'tko.utils/helpers/jasmine-13-helper.js';
import {
  dummyTemplateEngine
} from '../helpers/dummyTemplateEngine';

describe('Templating', function() {
    var bindingHandlers;

    beforeEach(jasmine.prepareTestNode);

    beforeEach(function () {
        // Set up the default binding handlers.
        var provider = new Provider();
        options.bindingProviderInstance = provider;
        provider.bindingHandlers.set(coreBindings);
        provider.bindingHandlers.set(templateBindings);

        bindingHandlers = provider.bindingHandlers;
    });

    afterEach(function() {
        setTemplateEngine(new nativeTemplateEngine());
    });

    it('Template engines can return an array of DOM nodes', function () {


        setTemplateEngine(new dummyTemplateEngine({ x: [document.createElement("div"), document.createElement("span")] }));
        renderTemplate("x", null);
    });

    it('Should not be able to render a template until a template engine is provided', function () {
        expect(function () {
            setTemplateEngine(undefined);
            renderTemplate("someTemplate", {});
        }).toThrow();
    });

    it('Should be able to render a template into a given DOM element', function () {
        setTemplateEngine(new dummyTemplateEngine({ someTemplate: "ABC" }));
        renderTemplate("someTemplate", null, null, testNode);
        expect(testNode.childNodes.length).toEqual(1);
        expect(testNode.innerHTML).toEqual("ABC");
    });

    it('Should be able to render an empty template', function() {
        setTemplateEngine(new dummyTemplateEngine({ emptyTemplate: "" }));
        renderTemplate("emptyTemplate", null, null, testNode);
        expect(testNode.childNodes.length).toEqual(0);
    });

    it('Should be able to access newly rendered/inserted elements in \'afterRender\' callback', function () {
        var passedElement, passedDataItem;
        var myCallback = function(elementsArray, dataItem) {
            expect(elementsArray.length).toEqual(1);
            passedElement = elementsArray[0];
            passedDataItem = dataItem;
        };
        var myModel = {};
        setTemplateEngine(new dummyTemplateEngine({ someTemplate: "ABC" }));
        renderTemplate("someTemplate", myModel, { afterRender: myCallback }, testNode);
        expect(passedElement.nodeValue).toEqual("ABC");
        expect(passedDataItem).toEqual(myModel);
    });

    it('Should automatically rerender into DOM element when dependencies change', function () {
        var dependency = observable("A");
        setTemplateEngine(new dummyTemplateEngine({ someTemplate: function () {
            return "Value = " + dependency();
        }
        }));

        renderTemplate("someTemplate", null, null, testNode);
        expect(testNode.childNodes.length).toEqual(1);
        expect(testNode.innerHTML).toEqual("Value = A");

        dependency("B");
        expect(testNode.childNodes.length).toEqual(1);
        expect(testNode.innerHTML).toEqual("Value = B");
    });

    it('Should not rerender DOM element if observable accessed in \'afterRender\' callback is changed', function () {
        var myObservable = observable("A"), count = 0;
        var myCallback = function(/*elementsArray, dataItem*/) {
            myObservable();   // access observable in callback
        };
        var myTemplate = function() {
            return "Value = " + (++count);
        };
        setTemplateEngine(new dummyTemplateEngine({ someTemplate: myTemplate }));
        renderTemplate("someTemplate", {}, { afterRender: myCallback }, testNode);
        expect(testNode.childNodes.length).toEqual(1);
        expect(testNode.innerHTML).toEqual("Value = 1");

        myObservable("B");
        expect(testNode.childNodes.length).toEqual(1);
        expect(testNode.innerHTML).toEqual("Value = 1");
    });

    it('If the supplied data item is observable, evaluates it and has subscription on it', function () {
        var myObservable = observable("A");
        setTemplateEngine(new dummyTemplateEngine({ someTemplate: function (data) {
            return "Value = " + data;
        }
        }));
        renderTemplate("someTemplate", myObservable, null, testNode);
        expect(testNode.innerHTML).toEqual("Value = A");

        myObservable("B");
        expect(testNode.innerHTML).toEqual("Value = B");
    });

    it('Should stop updating DOM nodes when the dependency next changes if the DOM node has been removed from the document', function () {
        var dependency = observable("A");
        var template = { someTemplate: function () { return "Value = " + dependency(); } };
        setTemplateEngine(new dummyTemplateEngine(template));

        renderTemplate("someTemplate", null, null, testNode);
        expect(testNode.childNodes.length).toEqual(1);
        expect(testNode.innerHTML).toEqual("Value = A");

        testNode.parentNode.removeChild(testNode);
        dependency("B");
        expect(testNode.childNodes.length).toEqual(1);
        expect(testNode.innerHTML).toEqual("Value = A");
    });

    it('Should be able to pick template via an observable', function () {
        setTemplateEngine(new dummyTemplateEngine({
            firstTemplate: "First template output",
            secondTemplate: "Second template output"
        }));

        var chosenTemplate = observable("firstTemplate");
        renderTemplate(chosenTemplate, null, null, testNode);
        expect(testNode.innerHTML).toEqual("First template output");

        chosenTemplate("secondTemplate");
        expect(testNode.innerHTML).toEqual("Second template output");
    });

    it('Should be able to render a template using data-bind syntax', function () {
        setTemplateEngine(new dummyTemplateEngine({ someTemplate: "template output" }));
        testNode.innerHTML = "<div data-bind='template:\"someTemplate\"'></div>";
        applyBindings(null, testNode);
        expect(testNode.childNodes[0].innerHTML).toEqual("template output");
    });

    it('Should remove existing content when rendering a template using data-bind syntax', function () {
        setTemplateEngine(new dummyTemplateEngine({ someTemplate: "template output" }));
        testNode.innerHTML = "<div data-bind='template:\"someTemplate\"'><span>existing content</span></div>";
        applyBindings(null, testNode);
        expect(testNode.childNodes[0].innerHTML).toEqual("template output");
    });

    it('Should be able to tell data-bind syntax which object to pass as data for the template (otherwise, uses viewModel)', function () {
        setTemplateEngine(new dummyTemplateEngine({ someTemplate: "result = [js: data.childProp]" }));
        testNode.innerHTML = "<div data-bind='template: { name: \"someTemplate\", data: someProp }'></div>";
        applyBindings({ someProp: { childProp: 123} }, testNode);
        expect(testNode.childNodes[0].innerHTML).toEqual("result = 123");
    });

    it('Should re-render a named template when its data item notifies about mutation', function () {
        setTemplateEngine(new dummyTemplateEngine({ someTemplate: "result = [js: data.childProp]" }));
        testNode.innerHTML = "<div data-bind='template: { name: \"someTemplate\", data: someProp }'></div>";

        var myData = observable({ childProp: 123 });
        applyBindings({ someProp: myData }, testNode);
        expect(testNode.childNodes[0].innerHTML).toEqual("result = 123");

        // Now mutate and notify
        myData().childProp = 456;
        myData.valueHasMutated();
        expect(testNode.childNodes[0].innerHTML).toEqual("result = 456");
    });

    it('Should stop tracking inner observables immediately when the container node is removed from the document', function() {
        var innerObservable = observable("some value");
        setTemplateEngine(new dummyTemplateEngine({ someTemplate: "result = [js: data.childProp()]" }));
        testNode.innerHTML = "<div data-bind='template: { name: \"someTemplate\", data: someProp }'></div>";
        applyBindings({ someProp: { childProp: innerObservable} }, testNode);

        expect(innerObservable.getSubscriptionsCount()).toEqual(1);
        removeNode(testNode.childNodes[0]);
        expect(innerObservable.getSubscriptionsCount()).toEqual(0);
    });

    it('Should be able to pick template via an observable model property', function () {
        setTemplateEngine(new dummyTemplateEngine({
            firstTemplate: "First template output",
            secondTemplate: "Second template output"
        }));

        var chosenTemplate = observable("firstTemplate");
        testNode.innerHTML = "<div data-bind='template: chosenTemplate'></div>";
        applyBindings({ chosenTemplate: chosenTemplate }, testNode);
        expect(testNode.childNodes[0].innerHTML).toEqual("First template output");

        chosenTemplate("secondTemplate");
        expect(testNode.childNodes[0].innerHTML).toEqual("Second template output");
    });

    it('Should be able to pick template via an observable model property when specified as "name"', function () {
        setTemplateEngine(new dummyTemplateEngine({
            firstTemplate: "First template output",
            secondTemplate: "Second template output"
        }));

        var chosenTemplate = observable("firstTemplate");
        testNode.innerHTML = "<div data-bind='template: { name: chosenTemplate }'></div>";
        applyBindings({ chosenTemplate: chosenTemplate }, testNode);
        expect(testNode.childNodes[0].innerHTML).toEqual("First template output");

        chosenTemplate("secondTemplate");
        expect(testNode.childNodes[0].innerHTML).toEqual("Second template output");
    });

    it('Should be able to pick template via an observable model property when specified as "name" in conjunction with "foreach"', function () {
        setTemplateEngine(new dummyTemplateEngine({
            firstTemplate: "First",
            secondTemplate: "Second"
        }));

        var chosenTemplate = observable("firstTemplate");
        testNode.innerHTML = "<div data-bind='template: { name: chosenTemplate, foreach: [1,2,3] }'></div>";
        applyBindings({ chosenTemplate: chosenTemplate }, testNode);
        expect(testNode.childNodes[0].innerHTML).toEqual("FirstFirstFirst");

        chosenTemplate("secondTemplate");
        expect(testNode.childNodes[0].innerHTML).toEqual("SecondSecondSecond");
    });

    it('Should be able to pick template as a function of the data item using data-bind syntax, with the binding context available as a second parameter', function () {
        var templatePicker = function(dataItem, bindingContext) {
            // Having the entire binding context available means you can read sibling or parent level properties
            expect(bindingContext.$parent.anotherProperty).toEqual(456);
            return dataItem.myTemplate;
        };
        setTemplateEngine(new dummyTemplateEngine({ someTemplate: "result = [js: data.childProp]" }));
        testNode.innerHTML = "<div data-bind='template: { name: templateSelectorFunction, data: someProp }'></div>";
        applyBindings({ someProp: { childProp: 123, myTemplate: "someTemplate" }, templateSelectorFunction: templatePicker, anotherProperty: 456 }, testNode);
        expect(testNode.childNodes[0].innerHTML).toEqual("result = 123");
    });

    it('Should be able to chain templates, rendering one from inside another', function () {
        setTemplateEngine(new dummyTemplateEngine({
            outerTemplate: "outer template output, [renderTemplate:innerTemplate]", // [renderTemplate:...] is special syntax supported by dummy template engine
            innerTemplate: "inner template output <span data-bind='text: 123'></span>"
        }));
        testNode.innerHTML = "<div data-bind='template:\"outerTemplate\"'></div>";
        applyBindings(null, testNode);
        expect(testNode.childNodes[0]).toContainHtml("outer template output, inner template output <span data-bind=\"text: 123\">123</span>");
    });

    it('Should rerender chained templates when their dependencies change, without rerendering parent templates', function () {
        var myObservable = observable("ABC");
        var timesRenderedOuter = 0, timesRenderedInner = 0;
        setTemplateEngine(new dummyTemplateEngine({
            outerTemplate: function () { timesRenderedOuter++; return "outer template output, [renderTemplate:innerTemplate]"; }, // [renderTemplate:...] is special syntax supported by dummy template engine
            innerTemplate: function () { timesRenderedInner++; return myObservable(); }
        }));
        testNode.innerHTML = "<div data-bind='template:\"outerTemplate\"'></div>";
        applyBindings(null, testNode);
        expect(testNode.childNodes[0]).toContainHtml("outer template output, abc");
        expect(timesRenderedOuter).toEqual(1);
        expect(timesRenderedInner).toEqual(1);

        myObservable("DEF");
        expect(testNode.childNodes[0]).toContainHtml("outer template output, def");
        expect(timesRenderedOuter).toEqual(1);
        expect(timesRenderedInner).toEqual(2);
    });

    it('Should stop tracking inner observables referenced by a chained template as soon as the chained template output node is removed from the document', function() {
        var innerObservable = observable("some value");
        setTemplateEngine(new dummyTemplateEngine({
            outerTemplate: "outer template output, <span id='innerTemplateOutput'>[renderTemplate:innerTemplate]</span>",
            innerTemplate: "result = [js: data.childProp()]"
        }));
        testNode.innerHTML = "<div data-bind='template: { name: \"outerTemplate\", data: someProp }'></div>";
        applyBindings({ someProp: { childProp: innerObservable} }, testNode);

        expect(innerObservable.getSubscriptionsCount()).toEqual(1);
        removeNode(document.getElementById('innerTemplateOutput'));
        expect(innerObservable.getSubscriptionsCount()).toEqual(0);
    });

    it('Should handle data-bind attributes from inside templates, regardless of element and attribute casing', function () {
        setTemplateEngine(new dummyTemplateEngine({ someTemplate: "<INPUT Data-Bind='value:\"Hi\"' />" }));
        renderTemplate("someTemplate", null, null, testNode);
        expect(testNode.childNodes[0].value).toEqual("Hi");
    });

    it('Should handle data-bind attributes that include newlines from inside templates', function () {
        setTemplateEngine(new dummyTemplateEngine({ someTemplate: "<input data-bind='value:\n\"Hi\"' />" }));
        renderTemplate("someTemplate", null, null, testNode);
        expect(testNode.childNodes[0].value).toEqual("Hi");
    });

    xit('Data binding syntax should be able to reference variables put into scope by the template engine', function () {
        // Disabling this because the only place where
        // templateRenderingVariablesInScope appears is with the
        // dummy template engine.  The Provider/Parser is never made
        // aware of it.
        setTemplateEngine(new dummyTemplateEngine({ someTemplate: "<input data-bind='value:message' />" }));
        renderTemplate("someTemplate", null, { templateRenderingVariablesInScope: { message: "hello"} }, testNode);
        expect(testNode.childNodes[0].value).toEqual("hello");
    });

    it('Should handle data-bind attributes with spaces around equals sign from inside templates and reference variables', function () {
        setTemplateEngine(new dummyTemplateEngine({ someTemplate: "<input data-bind = 'value:message' />" }));
        renderTemplate("someTemplate", { message: "hello" }, {}, testNode);
        expect(testNode.childNodes[0].value).toEqual("hello");
    });

    it('Data binding syntax should be able to use $element in binding value', function() {
        setTemplateEngine(new dummyTemplateEngine({ someTemplate: "<div data-bind='text: $element.tagName'></div>" }));
        renderTemplate("someTemplate", null, null, testNode);
        expect(testNode.childNodes[0]).toContainText("DIV");
    });

    it('Data binding syntax should be able to use $context in binding value to refer to the context object', function() {
        setTemplateEngine(new dummyTemplateEngine({ someTemplate: "<div data-bind='text: $context.$data === $data'></div>" }));
        renderTemplate("someTemplate", {}, null, testNode);
        expect(testNode.childNodes[0]).toContainText("true");
    });

    it('Data binding syntax should be able to use $rawData in binding value to refer to a top level template\'s view model observable', function() {
        var data = observable('value');
        setTemplateEngine(new dummyTemplateEngine({ someTemplate: "<div data-bind='text: isObservable($rawData)'></div>" }));

        options.bindingGlobals = { isObservable: isObservable };
        renderTemplate("someTemplate", data, null, testNode);
        expect(testNode.childNodes[0]).toContainText("true");
        expect(data.getSubscriptionsCount('change')).toEqual(1);    // only subscription is from the templating code
    });

    it('Data binding syntax should be able to use $rawData in binding value to refer to a data-bound template\'s view model observable', function() {
        setTemplateEngine(new dummyTemplateEngine({ someTemplate: "<div data-bind='text: isObservable($rawData)'></div>" }));
        testNode.innerHTML = "<div data-bind='template: { name: \"someTemplate\", data: someProp }'></div>";

        // Expose to access isObservable
        options.bindingGlobals = { isObservable: isObservable };
        var viewModel = { someProp: observable('value') };

        applyBindings(viewModel, testNode);

        expect(testNode.childNodes[0].childNodes[0]).toContainText("true");
        expect(viewModel.someProp.getSubscriptionsCount('change')).toEqual(1);    // only subscription is from the templating code
    });

    it('Data binding syntax should defer evaluation of variables until the end of template rendering (so bindings can take independent subscriptions to them)', function () {
        setTemplateEngine(new dummyTemplateEngine({
            someTemplate: "<input data-bind='value:message' />[js: options.templateRenderingVariablesInScope.message = 'goodbye'; undefined; ]"
        }));
        var viewModel = { message: "hello" };
        renderTemplate("someTemplate", viewModel, { templateRenderingVariablesInScope: viewModel }, testNode);
        expect(testNode.childNodes[0].value).toEqual("goodbye");
    });

    it('Data binding syntax should use the template\'s \'data\' object as the viewModel value (so \'this\' is set correctly when calling click handlers etc.)', function() {
        setTemplateEngine(new dummyTemplateEngine({
            someTemplate: "<button data-bind='click: someFunctionOnModel'>click me</button>"
        }));
        var viewModel = {
            didCallMyFunction : false,
            someFunctionOnModel : function() { this.didCallMyFunction = true; }
        };
        renderTemplate("someTemplate", viewModel, null, testNode);
        var buttonNode = testNode.childNodes[0];
        expect(buttonNode.tagName).toEqual("BUTTON"); // Be sure we're clicking the right thing
        buttonNode.click();
        expect(viewModel.didCallMyFunction).toEqual(true);
    });

    it('Data binding syntax should permit nested templates, and only bind inner templates once when using getBindingAccessors', function() {
        this.restoreAfter(options, 'bindingProviderInstance');

        // Will verify that bindings are applied only once for both inline (rewritten) bindings,
        // and external (non-rewritten) ones
        var originalBindingProvider = options.bindingProviderInstance;
        options.bindingProviderInstance = {
            bindingHandlers: originalBindingProvider.bindingHandlers,
            nodeHasBindings: function(node, bindingContext) {
                return (node.tagName == 'EM') || originalBindingProvider.nodeHasBindings(node, bindingContext);
            },
            getBindingAccessors: function(node, bindingContext) {
                if (node.tagName == 'EM') {
                    return {
                        text: function() {
                            return ++model.numExternalBindings;
                        }
                    };
                }
                return originalBindingProvider.getBindingAccessors(node, bindingContext);
            }
        };

        setTemplateEngine(new dummyTemplateEngine({
            outerTemplate: "Outer <div data-bind='template: { name: \"innerTemplate\", bypassDomNodeWrap: true }'></div>",
            innerTemplate: "Inner via inline binding: <span data-bind='text: ++numRewrittenBindings'></span>"
                         + "Inner via external binding: <em></em>"
        }));

        var model = { numRewrittenBindings: 0, numExternalBindings: 0 };
        testNode.innerHTML = "<div data-bind='template: { name: \"outerTemplate\", bypassDomNodeWrap: true }'></div>";
        applyBindings(model, testNode);
        // FIXME:  The following has the correct result in the
        // binding provider tests (i.e. prefix operator).  Unclear why
        // it fails here -- but the result is correct in the string produced
        // below.
        // expect(model.numRewrittenBindings).toEqual(1);
        expect(model.numExternalBindings).toEqual(1);
        expect(testNode.childNodes[0]).toContainHtml('outer <div data-bind="template: { name: &quot;innertemplate&quot;, bypassdomnodewrap: true }">inner via inline binding: <span data-bind="text: ++numrewrittenbindings">1</span>inner via external binding: <em>1</em></div>');
    });

    xit('Data binding syntax should permit nested templates, and only bind inner templates once when using getBindings', function() {
        // SKIP because we have deprecated getBindings in favour of
        // getBindingAccessors.

        this.restoreAfter(options, 'bindingProviderInstance');

        // Will verify that bindings are applied only once for both inline (rewritten) bindings,
        // and external (non-rewritten) ones. Because getBindings actually gets called twice, we need
        // to expect two calls (but still it's a single binding).
        var originalBindingProvider = options.bindingProviderInstance;
        options.bindingProviderInstance = {
            bindingHandlers: originalBindingProvider.bindingHandlers,
            nodeHasBindings: function(node, bindingContext) {
                return (node.tagName == 'EM') || originalBindingProvider.nodeHasBindings(node, bindingContext);
            },
            getBindings: function(node, bindingContext) {
                if (node.tagName == 'EM')
                    return { text: ++model.numExternalBindings };
                return originalBindingProvider.getBindings(node, bindingContext);
            }
        };

        setTemplateEngine(new dummyTemplateEngine({
            outerTemplate: "Outer <div data-bind='template: { name: \"innerTemplate\", bypassDomNodeWrap: true }'></div>",
            innerTemplate: "Inner via inline binding: <span data-bind='text: ++numRewrittenBindings'></span>"
                         + "Inner via external binding: <em></em>"
        }));
        var model = { numRewrittenBindings: 0, numExternalBindings: 0 };
        testNode.innerHTML = "<div data-bind='template: { name: \"outerTemplate\", bypassDomNodeWrap: true }'></div>";
        applyBindings(model, testNode);
        expect(model.numRewrittenBindings).toEqual(1);
        expect(model.numExternalBindings).toEqual(2);
        expect(testNode.childNodes[0]).toContainHtml("outer <div>inner via inline binding: <span>1</span>inner via external binding: <em>2</em></div>");
    });

    it('Should accept a "nodes" option that gives the template nodes', function() {
        // This is an alternative to specifying a named template, and is useful in conjunction with components
        setTemplateEngine(new dummyTemplateEngine({
            innerTemplate: "the name is [js: data.name()]" // See that custom template engines are applied to the injected nodes
        }));

        testNode.innerHTML = "<div data-bind='template: { nodes: testNodes, data: testData, bypassDomNodeWrap: true }'></div>";
        var model = {
            testNodes: [
                document.createTextNode("begin"),
                document.createElement("span"),
                document.createTextNode("end")
            ],
            testData: { name: observable("alpha") }
        };
        model.testNodes[1].setAttribute("data-bind", "template: 'innerTemplate'"); // See that bindings are applied to the injected nodes

        applyBindings(model, testNode);
        expect(testNode.childNodes[0]).toContainHtml('begin<span data-bind="template: \'innertemplate\'">the name is alpha</span>end');

        // The injected bindings update to match model changes as usual
        model.testData.name("beta");
        expect(testNode.childNodes[0]).toContainHtml('begin<span data-bind="template: \'innertemplate\'">the name is beta</span>end');
    });

    it('Should accept a "nodes" option that gives the template nodes, and it can be used in conjunction with "foreach"', function() {
        testNode.innerHTML = "<div data-bind='template: { nodes: testNodes, foreach: testData, bypassDomNodeWrap: true }'></div>";

        // This time we'll check that the nodes array doesn't have to be a real array - it can be the .childNodes
        // property of a DOM element, which is subtly different.
        var templateContainer = document.createElement("div");
        templateContainer.innerHTML = "[<span data-bind='text: name'></span>]";
        var model = {
            testNodes: templateContainer.childNodes,
            testData: observableArray([{ name: observable("alpha") }, { name: "beta" }, { name: "gamma" }])
        };
        model.testNodes[1].setAttribute("data-bind", "text: name");

        applyBindings(model, testNode);
        expect(testNode.childNodes[0]).toContainText("[alpha][beta][gamma]");

        // The injected bindings update to match model changes as usual
        model.testData.splice(1, 1);
        expect(testNode.childNodes[0]).toContainText("[alpha][gamma]");

        // Changing the nodes array does *not* affect subsequent output from the template.
        // This behavior may be subject to change. I'm adding this assertion just to record what
        // the current behavior is, even if we might want to alter it in the future. We don't need
        // to document or make any guarantees about what happens if you do this - it's just not
        // a supported thing to do.
        templateContainer.innerHTML = "[Modified, but will not appear in template output because the nodes were already cloned]";
        model.testData.splice(1, 0, { name: "delta" });
        expect(testNode.childNodes[0]).toContainText("[alpha][delta][gamma]");
    });

    it('Should interpret "nodes: anyFalseyValue" as being equivalent to supplying an empty node array', function() {
        // This behavior helps to avoid inconsistency if you're programmatically supplying a node array
        // but sometimes you might not have any nodes - you don't want the template binding to dynamically
        // switch over to "inline template" mode just because your 'nodes' value is null, for example.
        testNode.innerHTML = "<div data-bind='template: { nodes: null, bypassDomNodeWrap: true }'>Should not use this inline template</div>";
        applyBindings(null, testNode);
        expect(testNode.childNodes[0]).toContainHtml('');
    });

    it('Should not allow "nodes: someObservableArray"', function() {
        // See comment in implementation for reasoning
        testNode.innerHTML = "<div data-bind='template: { nodes: myNodes, bypassDomNodeWrap: true }'>Should not use this inline template</div>";
        expect(function() {
            applyBindings({ myNodes: observableArray() }, testNode);
        }).toThrowContaining("The \"nodes\" option must be a plain, non-observable array");
    });

    describe('Data binding \'foreach\' option', function() {
        it('Should remove existing content', function () {
            setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "<span>template content</span>" }));
            testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'><span>existing content</span></div>";

            applyBindings({ myCollection: [ {} ] }, testNode);
            expect(testNode.childNodes[0]).toContainHtml("<span>template content</span>");
        });

        it('Should render for each item in an array but doesn\'t rerender everything if you push or splice', function () {
            var myArray = observableArray([{ personName: "Bob" }, { personName: "Frank"}]);
            setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "<div>The item is [js: data.personName]</div>" }));
            testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

            applyBindings({ myCollection: myArray }, testNode);
            expect(testNode.childNodes[0]).toContainHtml("<div>the item is bob</div><div>the item is frank</div>");
            var originalBobNode = testNode.childNodes[0].childNodes[0];
            var originalFrankNode = testNode.childNodes[0].childNodes[1];

            myArray.push({ personName: "Steve" });
            expect(testNode.childNodes[0]).toContainHtml("<div>the item is bob</div><div>the item is frank</div><div>the item is steve</div>");
            expect(testNode.childNodes[0].childNodes[0]).toEqual(originalBobNode);
            expect(testNode.childNodes[0].childNodes[1]).toEqual(originalFrankNode);
        });

        it('Should apply bindings within the context of each item in the array', function () {
            var myArray = observableArray([{ personName: "Bob" }, { personName: "Frank"}]);
            setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "The item is <span data-bind='text: personName'></span>" }));
            testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

            applyBindings({ myCollection: myArray }, testNode);
            expect(testNode.childNodes[0]).toContainHtml("the item is <span data-bind=\"text: personname\">bob</span>the item is <span data-bind=\"text: personname\">frank</span>");
        });

        it('Should only bind each group of output nodes once', function() {
            var initCalls = 0;
            bindingHandlers.countInits = { init: function() { initCalls++; } };
            setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "<span data-bind='countInits: true'></span>" }));
            testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

            applyBindings({ myCollection: [1,2,3] }, testNode);
            expect(initCalls).toEqual(3); // 3 because there were 3 items in myCollection
        });

        it('Should handle templates in which the very first node has a binding', function() {
            // Represents https://github.com/SteveSanderson/knockout/pull/440
            // Previously, the rewriting (which introduces a comment node before the bound node) was interfering
            // with the array-to-DOM-node mapping state tracking
            setTemplateEngine(new dummyTemplateEngine({ mytemplate: "<div data-bind='text: $data'></div>" }));
            testNode.innerHTML = "<div data-bind=\"template: { name: 'mytemplate', foreach: items }\"></div>";

            // Bind against initial array containing one entry. UI just shows "original"
            var myArray = observableArray(["original"]);
            applyBindings({ items: myArray }, testNode);
            expect(testNode.childNodes[0]).toContainHtml('<div data-bind="text: $data">original</div>');

            // Now replace the entire array contents with one different entry.
            // UI just shows "new" (previously with bug, showed "original" AND "new")
            myArray(["new"]);
            expect(testNode.childNodes[0]).toContainHtml('<div data-bind="text: $data">new</div>');
        });

        it('Should handle chained templates in which the very first node has a binding', function() {
            // See https://github.com/SteveSanderson/knockout/pull/440 and https://github.com/SteveSanderson/knockout/pull/144
            setTemplateEngine(new dummyTemplateEngine({
                outerTemplate: "<div data-bind='text: $data'></div>[renderTemplate:innerTemplate]x", // [renderTemplate:...] is special syntax supported by dummy template engine
                innerTemplate: "inner <span data-bind='text: 123'></span>"
            }));
            testNode.innerHTML = "<div data-bind=\"template: { name: 'outerTemplate', foreach: items }\"></div>";

            // Bind against initial array containing one entry.
            var myArray = observableArray(["original"]);
            applyBindings({ items: myArray }, testNode);
            expect(testNode.childNodes[0]).toContainHtml('<div data-bind="text: $data">original</div>inner <span data-bind="text: 123">123</span>x');

            // Now replace the entire array contents with one different entry.
            myArray(["new"]);
            expect(testNode.childNodes[0]).toContainHtml("<div data-bind=\"text: $data\">new</div>inner <span data-bind=\"text: 123\">123</span>x");
        });

        it('Should handle templates in which the very first node has a binding but it does not reference any observables', function() {
            // Represents https://github.com/SteveSanderson/knockout/issues/739
            // Previously, the rewriting (which introduces a comment node before the bound node) was interfering
            // with the array-to-DOM-node mapping state tracking
            setTemplateEngine(new dummyTemplateEngine({ mytemplate: "<div data-bind='attr: {}'>[js:data.name()]</div>" }));
            testNode.innerHTML = "<div data-bind=\"template: { name: 'mytemplate', foreach: items }\"></div>";

            // Bind against array, referencing an observable property
            var myItem = { name: observable("a") };
            applyBindings({ items: [myItem] }, testNode);
            expect(testNode.childNodes[0]).toContainHtml("<div data-bind=\"attr: {}\">a</div>");

            // Modify the observable property and check that UI is updated
            // Previously with the bug, it wasn't updated because the removal of the memo comment caused the array-to-DOM-node computed to be disposed
            myItem.name("b");
            expect(testNode.childNodes[0]).toContainHtml("<div data-bind=\"attr: {}\">b</div>");
        });

        it('Should apply bindings with an $index in the context', function () {
            var myArray = observableArray([{ personName: "Bob" }, { personName: "Frank"}]);
            setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "The item # is <span data-bind='text: $index'></span>" }));
            testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

            applyBindings({ myCollection: myArray }, testNode);
            expect(testNode.childNodes[0]).toContainHtml("the item # is <span data-bind=\"text: $index\">0</span>the item # is <span data-bind=\"text: $index\">1</span>");
        });

        it('Should update bindings that reference an $index if the list changes', function () {
            var myArray = observableArray([{ personName: "Bob" }, { personName: "Frank"}]);
            setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "The item <span data-bind='text: personName'></span>is <span data-bind='text: $index'></span>" }));
            testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

            applyBindings({ myCollection: myArray }, testNode);
            expect(testNode.childNodes[0]).toContainHtml('the item <span data-bind="text: personname">bob</span>is <span data-bind="text: $index">0</span>the item <span data-bind="text: personname">frank</span>is <span data-bind="text: $index">1</span>');

            var frank = myArray.pop(); // remove frank
            expect(testNode.childNodes[0]).toContainHtml('the item <span data-bind="text: personname">bob</span>is <span data-bind="text: $index">0</span>');

            myArray.unshift(frank); // put frank in the front
            expect(testNode.childNodes[0]).toContainHtml('the item <span data-bind="text: personname">frank</span>is <span data-bind="text: $index">0</span>the item <span data-bind="text: personname">bob</span>is <span data-bind="text: $index">1</span>');
        });

        it('Should accept array with "undefined" and "null" items', function () {
            var myArray = observableArray([undefined, null]);
            setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "The item is <span data-bind='text: String($data)'></span>" }));
            testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

            options.bindingGlobals = { String: String };
            applyBindings({ myCollection: myArray }, testNode);
            expect(testNode.childNodes[0]).toContainHtml("the item is <span data-bind=\"text: string($data)\">undefined</span>the item is <span data-bind=\"text: string($data)\">null</span>");
        });

        it('Should update DOM nodes when a dependency of their mapping function changes', function() {
            var myObservable = observable("Steve");
            var myArray = observableArray([{ personName: "Bob" }, { personName: myObservable }, { personName: "Another" }]);
            setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "<div>The item is [js: unwrap(data.personName)]</div>" }));
            testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

            applyBindings({ myCollection: myArray }, testNode);
            expect(testNode.childNodes[0]).toContainHtml("<div>the item is bob</div><div>the item is steve</div><div>the item is another</div>");
            var originalBobNode = testNode.childNodes[0].childNodes[0];

            myObservable("Steve2");
            expect(testNode.childNodes[0]).toContainHtml("<div>the item is bob</div><div>the item is steve2</div><div>the item is another</div>");
            expect(testNode.childNodes[0].childNodes[0]).toEqual(originalBobNode);

            // Ensure we can still remove the corresponding nodes (even though they've changed), and that doing so causes the subscription to be disposed
            expect(myObservable.getSubscriptionsCount()).toEqual(1);
            myArray.splice(1, 1);
            expect(testNode.childNodes[0]).toContainHtml("<div>the item is bob</div><div>the item is another</div>");
            myObservable("Something else"); // Re-evaluating the observable causes the orphaned subscriptions to be disposed
            expect(myObservable.getSubscriptionsCount()).toEqual(0);
        });

        it('Should treat a null parameter as meaning \'no items\'', function() {
            var myArray = observableArray(["A", "B"]);
            setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "hello" }));
            testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

            applyBindings({ myCollection: myArray }, testNode);
            expect(testNode.childNodes[0].childNodes.length).toEqual(2);

            // Now set the observable to null and check it's treated like an empty array
            // (because how else should null be interpreted?)
            myArray(null);
            expect(testNode.childNodes[0].childNodes.length).toEqual(0);
        });

        it('Should accept an \"as\" option to define an alias for the iteration variable', function() {
            // Note: There are more detailed specs (e.g., covering nesting) associated with the "foreach" binding which
            // uses this templating functionality internally.
            var myArray = observableArray(["A", "B"]);
            setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "[js:bindingContext.myAliasedItem]" }));
            testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection, as: \"myAliasedItem\" }'></div>";

            applyBindings({ myCollection: myArray }, testNode);
            expect(testNode.childNodes[0]).toContainText("AB");
        });

        it('Should stop tracking inner observables when the container node is removed', function() {
            var innerObservable = observable("some value");
            var myArray = observableArray([{obsVal:innerObservable}, {obsVal:innerObservable}]);
            setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "The item is [js: unwrap(data.obsVal)]" }));
            testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

            applyBindings({ myCollection: myArray }, testNode);
            expect(innerObservable.getSubscriptionsCount()).toEqual(2);

            removeNode(testNode.childNodes[0]);
            expect(innerObservable.getSubscriptionsCount()).toEqual(0);
        });

        it('Should stop tracking inner observables related to each array item when that array item is removed', function() {
            var innerObservable = observable("some value");
            var myArray = observableArray([{obsVal:innerObservable}, {obsVal:innerObservable}]);
            setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "The item is [js: unwrap(data.obsVal)]" }));
            testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

            applyBindings({ myCollection: myArray }, testNode);
            expect(innerObservable.getSubscriptionsCount()).toEqual(2);

            myArray.splice(1, 1);
            expect(innerObservable.getSubscriptionsCount()).toEqual(1);
            myArray([]);
            expect(innerObservable.getSubscriptionsCount()).toEqual(0);
        });

        it('Should omit any items whose \'_destroy\' flag is set (unwrapping the flag if it is observable)', function() {
            var myArray = observableArray([{ someProp: 1 }, { someProp: 2, _destroy: 'evals to true' }, { someProp : 3 }, { someProp: 4, _destroy: observable(false) }]);
            setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "<div>someProp=[js: data.someProp]</div>" }));
            testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

            applyBindings({ myCollection: myArray }, testNode);
            expect(testNode.childNodes[0]).toContainHtml("<div>someprop=1</div><div>someprop=3</div><div>someprop=4</div>");
        });

        it('Should include any items whose \'_destroy\' flag is set if you use includeDestroyed', function() {
            var myArray = observableArray([{ someProp: 1 }, { someProp: 2, _destroy: 'evals to true' }, { someProp : 3 }]);
            setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "<div>someProp=[js: data.someProp]</div>" }));
            testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection, includeDestroyed: true }'></div>";

            applyBindings({ myCollection: myArray }, testNode);
            expect(testNode.childNodes[0]).toContainHtml("<div>someprop=1</div><div>someprop=2</div><div>someprop=3</div>");
        });

        it('Should be able to render a different template for each array entry by passing a function as template name, with the array entry\'s binding context available as a second parameter', function() {
            var myArray = observableArray([
                { preferredTemplate: 1, someProperty: 'firstItemValue' },
                { preferredTemplate: 2, someProperty: 'secondItemValue' }
            ]);
            setTemplateEngine(new dummyTemplateEngine({
                firstTemplate: "<div>Template1Output, [js: data.someProperty]</div>",
                secondTemplate: "<div>Template2Output, [js: data.someProperty]</div>"
            }));
            testNode.innerHTML = "<div data-bind='template: {name: getTemplateModelProperty, foreach: myCollection}'></div>";

            var getTemplate = function(dataItem, bindingContext) {
                // Having the item's binding context available means you can read sibling or parent level properties
                expect(bindingContext.$parent.anotherProperty).toEqual(123);

                return dataItem.preferredTemplate == 1 ? 'firstTemplate' : 'secondTemplate';
            };
            applyBindings({ myCollection: myArray, getTemplateModelProperty: getTemplate, anotherProperty: 123 }, testNode);
            expect(testNode.childNodes[0]).toContainHtml("<div>template1output, firstitemvalue</div><div>template2output, seconditemvalue</div>");
        });

        it('Should update all child contexts and bindings when used with a top-level observable view model', function() {
            var myVm = observable({items: ['A', 'B', 'C'], itemValues: { 'A': [1, 2, 3], 'B': [4, 5, 6], 'C': [7, 8, 9] }});
            var engine = new dummyTemplateEngine({
                itemTemplate: "<span>The <span data-bind='text: $index'>&nbsp;</span> item <span data-bind='text: $data'>&nbsp;</span> has <span data-bind='template: { name: \"valueTemplate\", foreach: $root.itemValues[$data] }'>&nbsp;</span> </span>",
                valueTemplate: "<span data-bind='text: $index'>&nbsp;</span>.<span data-bind='text: $data'>&nbsp;</span>,"
            });
            engine.createJavaScriptEvaluatorBlock = function (script) { return "[[js:" + script + "]]"; };  // because we're using a binding with brackets
            setTemplateEngine(engine);

            testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: items }'></div>";

            applyBindings(myVm, testNode);
            expect(testNode.childNodes[0]).toContainText("The 0 item A has 0.1,1.2,2.3, The 1 item B has 0.4,1.5,2.6, The 2 item C has 0.7,1.8,2.9, ");

            myVm({items: ['C', 'B', 'A'], itemValues: { 'A': [1, 2, 30], 'B': [4, 5, 60], 'C': [7, 8, 90] }});
            expect(testNode.childNodes[0]).toContainText("The 0 item C has 0.7,1.8,2.90, The 1 item B has 0.4,1.5,2.60, The 2 item A has 0.1,1.2,2.30, ");
        });

    });

    it('Data binding syntax should support \"if\" condition', function() {
        setTemplateEngine(new dummyTemplateEngine({ myTemplate: "Value: [js: data.myProp().childProp]" }));
        testNode.innerHTML = "<div data-bind='template: { name: \"myTemplate\", \"if\": myProp }'></div>";

        var viewModel = { myProp: observable({ childProp: 'abc' }) };
        applyBindings(viewModel, testNode);

        // Initially there is a value
        expect(testNode.childNodes[0]).toContainText("Value: abc");

        // Causing the condition to become false causes the output to be removed
        viewModel.myProp(null);
        expect(testNode.childNodes[0]).toContainText("");

        // Causing the condition to become true causes the output to reappear
        viewModel.myProp({ childProp: 'def' });
        expect(testNode.childNodes[0]).toContainText("Value: def");
    });

    it('Data binding syntax should support \"ifnot\" condition', function() {
        setTemplateEngine(new dummyTemplateEngine({ myTemplate: "Hello" }));
        testNode.innerHTML = "<div data-bind='template: { name: \"myTemplate\", ifnot: shouldHide }'></div>";

        var viewModel = { shouldHide: observable(true) };
        applyBindings(viewModel, testNode);

        // Initially there is no output (shouldHide=true)
        expect(testNode.childNodes[0]).toContainText("");

        // Causing the condition to become false causes the output to be displayed
        viewModel.shouldHide(false);
        expect(testNode.childNodes[0]).toContainText("Hello");

        // Causing the condition to become true causes the output to disappear
        viewModel.shouldHide(true);
        expect(testNode.childNodes[0]).toContainText("");
    });

    it('Data binding syntax should support \"if\" condition in conjunction with foreach', function() {
        setTemplateEngine(new dummyTemplateEngine({ myTemplate: "Value: [js: data.myProp().childProp]" }));
        testNode.innerHTML = "<div data-bind='template: { name: \"myTemplate\", \"if\": myProp, foreach: [$data, $data, $data] }'></div>";

        var viewModel = { myProp: observable({ childProp: 'abc' }) };
        applyBindings(viewModel, testNode);
        expect(testNode.childNodes[0].childNodes[0].nodeValue).toEqual("Value: abc");
        expect(testNode.childNodes[0].childNodes[1].nodeValue).toEqual("Value: abc");
        expect(testNode.childNodes[0].childNodes[2].nodeValue).toEqual("Value: abc");

        // Causing the condition to become false causes the output to be removed
        viewModel.myProp(null);
        expect(testNode.childNodes[0]).toContainText("");

        // Causing the condition to become true causes the output to reappear
        viewModel.myProp({ childProp: 'def' });
        expect(testNode.childNodes[0].childNodes[0].nodeValue).toEqual("Value: def");
        expect(testNode.childNodes[0].childNodes[1].nodeValue).toEqual("Value: def");
        expect(testNode.childNodes[0].childNodes[2].nodeValue).toEqual("Value: def");
    });

    it('Should be able to populate checkboxes from inside templates, despite IE6 limitations', function () {
        setTemplateEngine(new dummyTemplateEngine({ someTemplate: "<input type='checkbox' data-bind='checked:isChecked' />" }));
        renderTemplate("someTemplate", {isChecked: true}, {}, testNode);
        expect(testNode.childNodes[0].checked).toEqual(true);
    });

    it('Should be able to populate radio buttons from inside templates, despite IE6 limitations', function () {
        setTemplateEngine(new dummyTemplateEngine({ someTemplate: "<input type='radio' name='somename' value='abc' data-bind='checked:someValue' />" }));
        renderTemplate("someTemplate", {someValue: 'abc'}, {}, testNode);
        expect(testNode.childNodes[0].checked).toEqual(true);
    });

    it('Data binding \'templateOptions\' should be passed to template', function() {
        var myModel = {
            someAdditionalData: { myAdditionalProp: "someAdditionalValue" },
            people: observableArray([
                { name: "Alpha" },
                { name: "Beta" }
            ])
        };
        setTemplateEngine(new dummyTemplateEngine({myTemplate: "<div>Person [js:data.name] has additional property [js:options.templateOptions.myAdditionalProp]</div>"}));
        testNode.innerHTML = "<div data-bind='template: {name: \"myTemplate\", foreach: people, templateOptions: someAdditionalData }'></div>";

        applyBindings(myModel, testNode);
        expect(testNode.childNodes[0]).toContainHtml("<div>person alpha has additional property someadditionalvalue</div><div>person beta has additional property someadditionalvalue</div>");
    });

    it('If the template binding is updated, should dispose any template subscriptions previously associated with the element', function() {
        var myObservable = observable("some value"),
            myModel = {
                subModel: observable({ myObservable: myObservable })
            };
        setTemplateEngine(new dummyTemplateEngine({myTemplate: "<span>The value is [js: data.myObservable()]</span>"}));
        testNode.innerHTML = "<div data-bind='template: {name: \"myTemplate\", data: subModel}'></div>";
        applyBindings(myModel, testNode);

        // Right now the template references myObservable, so there should be exactly one subscription on it
        expect(testNode.childNodes[0]).toContainText("The value is some value");
        expect(myObservable.getSubscriptionsCount()).toEqual(1);
        var renderedNode1 = testNode.childNodes[0].childNodes[0];

        // By changing the object for subModel, we force the data-bind value to be re-evaluated and the template to be re-rendered,
        // setting up a new template subscription, so there have now existed two subscriptions on myObservable...
        myModel.subModel({ myObservable: myObservable });
        expect(testNode.childNodes[0].childNodes[0]).not.toEqual(renderedNode1);

        // ...but, because the old subscription should have been disposed automatically, there should only be one left
        expect(myObservable.getSubscriptionsCount()).toEqual(1);
    });

    it('Should be able to specify a template engine instance using data-bind syntax', function() {
        setTemplateEngine(new dummyTemplateEngine({ theTemplate: "Default output" })); // Not going to use this one
        var alternativeTemplateEngine = new dummyTemplateEngine({ theTemplate: "Alternative output" });

        testNode.innerHTML = "<div data-bind='template: { name: \"theTemplate\", templateEngine: chosenEngine }'></div>";
        applyBindings({ chosenEngine: alternativeTemplateEngine }, testNode);

        expect(testNode.childNodes[0]).toContainText("Alternative output");
    });

    it('Should be able to bind $data to an alias using \'as\'', function() {
        setTemplateEngine(new dummyTemplateEngine({
            myTemplate: "ValueLiteral: [js: data.prop], ValueBound: <span data-bind='text: item.prop'></span>"
        }));
        testNode.innerHTML = "<div data-bind='template: { name: \"myTemplate\", data: someItem, as: \"item\" }'></div>";
        applyBindings({ someItem: { prop: 'Hello' } }, testNode);
        expect(testNode.childNodes[0]).toContainText("ValueLiteral: Hello, ValueBound: Hello");
    });

    it('Data-bind syntax should expose parent binding context as $parent if binding with an explicit \"data\" value', function() {
        setTemplateEngine(new dummyTemplateEngine({
            myTemplate: "ValueLiteral: [js:bindingContext.$parent.parentProp], ValueBound: <span data-bind='text: $parent.parentProp'></span>"
        }));
        testNode.innerHTML = "<div data-bind='template: { name: \"myTemplate\", data: someItem }'></div>";
        applyBindings({ someItem: {}, parentProp: 'Hello' }, testNode);
        expect(testNode.childNodes[0]).toContainText("ValueLiteral: Hello, ValueBound: Hello");
    });

    it('Data-bind syntax should expose all ancestor binding contexts as $parents', function() {
        setTemplateEngine(new dummyTemplateEngine({
            outerTemplate:  "<div data-bind='template: { name:\"middleTemplate\", data: middleItem }'></div>",
            middleTemplate: "<div data-bind='template: { name: \"innerTemplate\", data: innerItem }'></div>",
            innerTemplate:  "(Data:[js:bindingContext.$data.val], Parent:[[js:bindingContext.$parents[0].val]], Grandparent:[[js:bindingContext.$parents[1].val]], Root:[js:bindingContext.$root.val], Depth:[js:bindingContext.$parents.length])"
        }));
        testNode.innerHTML = "<div data-bind='template: { name: \"outerTemplate\", data: outerItem }'></div>";

        applyBindings({
            val: "ROOT",
            outerItem: {
                val: "OUTER",
                middleItem: {
                    val: "MIDDLE",
                    innerItem: { val: "INNER" }
                }
            }
        }, testNode);
        expect(testNode.childNodes[0].childNodes[0]).toContainText("(Data:INNER, Parent:MIDDLE, Grandparent:OUTER, Root:ROOT, Depth:3)");
    });

    xit('Should not be allowed to rewrite templates that embed anonymous templates', function() {
        // SKIP because we have removed template rewriting.
        //
        // ----
        // The reason is that your template engine's native control flow and variable evaluation logic is going to run first, independently
        // of any KO-native control flow, so variables would get evaluated in the wrong context. Example:
        //
        // <div data-bind="foreach: someArray">
        //     ${ somePropertyOfEachArrayItem }   <-- This gets evaluated *before* the foreach binds, so it can't reference array entries
        // </div>
        //
        // It should be perfectly OK to fix this just by preventing anonymous templates within rewritten templates, because
        // (1) The developer can always use their template engine's native control flow syntax instead of the KO-native ones - that will work
        // (2) The developer can use KO's native templating instead, if they are keen on KO-native control flow or anonymous templates

        setTemplateEngine(new dummyTemplateEngine({
            myTemplate: "<div data-bind='template: { data: someData }'>Childprop: [js: data.childProp]</div>"
        }));
        testNode.innerHTML = "<div data-bind='template: { name: \"myTemplate\" }'></div>";

        expect(function () {
            applyBindings({ someData: { childProp: 'abc' } }, testNode);
        }).toThrowContaining("This template engine does not support anonymous templates nested within its templates");
    });

    xit('Should not be allowed to rewrite templates that embed control flow bindings', function() {
        // SKIP because we have removed template rewriting.
        // ----
        // Same reason as above (also include binding names with quotes and spaces to show that formatting doesn't matter)
        arrayForEach(['if', 'ifnot', 'with', 'foreach', '"if"', ' with '], function(bindingName) {
            setTemplateEngine(new dummyTemplateEngine({ myTemplate: "<div data-bind='" + bindingName + ": \"SomeValue\"'>Hello</div>" }));
            testNode.innerHTML = "<div data-bind='template: { name: \"myTemplate\" }'></div>";

            domData.clear(testNode);
            expect(function () {
                applyBindings({ someData: { childProp: 'abc' } }, testNode);
            }).toThrowContaining("This template engine does not support");
        });
    });

    it('Data binding syntax should permit nested templates using virtual containers (with arbitrary internal whitespace and newlines)', function() {
        setTemplateEngine(new dummyTemplateEngine({
            outerTemplate: "Outer <!-- ko template: " +
                "{ name: \"innerTemplate\" } " +
                "--><!-- /ko -->",
            innerTemplate: "Inner via inline binding: <span data-bind='text: \"someText\"'></span>"
        }));
        var model = { };
        testNode.innerHTML = "<div data-bind='template: { name: \"outerTemplate\" }'></div>";
        applyBindings(model, testNode);
        expect(testNode.childNodes[0]).toContainHtml("outer <!-- ko template: { name: \"innertemplate\" } -->inner via inline binding: <span data-bind=\"text: &quot;sometext&quot;\">sometext</span><!-- /ko -->");
    });

    it('Should be able to render anonymous templates using virtual containers', function() {
        setTemplateEngine(new dummyTemplateEngine());
        testNode.innerHTML = "Start <!-- ko template: { data: someData } -->Childprop: [js: data.childProp]<!-- /ko --> End";
        applyBindings({ someData: { childProp: 'abc' } }, testNode);
        expect(testNode).toContainHtml("start <!-- ko template: { data: somedata } -->childprop: abc<!-- /ko -->end");
    });

    it("Should render sub-context with {data: }", function () {
        testNode.innerHTML = "<div data-bind='template: {data: outer}'><span data-bind='text: inner'></span></div>";
        applyBindings({ outer: {inner: "x" }}, testNode);
        expect(testNode).toContainHtml('<div data-bind="template: {data: outer}"><span data-bind="text: inner">x</span></div>');
    });

    it('Should be able to use anonymous templates that contain first-child comment nodes', function() {
        // This represents issue https://github.com/SteveSanderson/knockout/issues/188
        // (IE < 9 strips out leading comment nodes when you use .innerHTML)
        setTemplateEngine(new dummyTemplateEngine({}));
        testNode.innerHTML = "start <div data-bind='foreach: [1,2]'><span><!-- leading comment -->hello</span></div>";
        applyBindings(null, testNode);
        expect(testNode).toContainHtml('start <div data-bind="foreach: [1,2]"><span><!-- leading comment -->hello</span><span><!-- leading comment -->hello</span></div>');
    });

    it('Should allow anonymous templates output to include top-level virtual elements, and will bind their virtual children only once', function() {
        delete bindingHandlers.nonexistentHandler;
        var initCalls = 0;
        bindingHandlers.countInits = { init: function () { initCalls++; } };
        testNode.innerHTML = "<div data-bind='template: {}'><!-- ko nonexistentHandler: true --><span data-bind='countInits: true'></span><!-- /ko --></div>";
        applyBindings(null, testNode);
        expect(initCalls).toEqual(1);
    });

    it('Should be possible to combine template rewriting, foreach, and a node preprocessor', function() {
        this.restoreAfter(options, 'bindingProviderInstance');

        // This spec verifies that the use of fixUpContinuousNodeArray in templating.js correctly handles the scenario
        // where a memoized comment node is the first node outputted by 'foreach', and it gets removed by unmemoization.
        // In this case we rely on fixUpContinuousNodeArray to work out which remaining nodes correspond to the 'foreach'
        // output so they can later be removed when the model array changes.
        var originalBindingProvider = options.bindingProviderInstance,
            preprocessingBindingProvider = function() { };
        preprocessingBindingProvider.prototype = originalBindingProvider;
        options.bindingProviderInstance = new preprocessingBindingProvider();
        options.bindingProviderInstance.preprocessNode = function(node) {
            // This preprocessor doesn't change the rendered nodes. But simply having a preprocessor means
            // that templating.js has to recompute which DOM nodes correspond to the foreach output, since
            // you might have modified that set.
            return [node];
        };

        setTemplateEngine(new dummyTemplateEngine({}));
        testNode.innerHTML = "<div data-bind='template: { foreach: items }'><button data-bind='text: $data'></button> OK. </div>";
        var items = observableArray(['Alpha', 'Beta']);
        applyBindings({ items: items }, testNode);
        expect(testNode).toContainText('Alpha OK. Beta OK. ');

        // Check that 'foreach' knows which set of elements to remove when an item vanishes from the model array,
        // even though the original 'foreach' output's first node, the memo comment, was removed during unmemoization.
        items.shift();
        expect(testNode).toContainText('Beta OK. ');
    });

    it('Should not throw errors if trying to apply text to a non-rendered node', function() {
        // Represents https://github.com/SteveSanderson/knockout/issues/660
        // A <span> can't go directly into a <tr>, so modern browsers will silently strip it. We need to verify this doesn't
        // throw errors during unmemoization (when unmemoizing, it will try to apply the text to the following text node
        // instead of the node you intended to bind to).
        // Note that IE < 9 won't strip the <tr>; instead it has much stranger behaviors regarding unexpected DOM structures.
        // It just happens not to give an error in this particular case, though it would throw errors in many other cases
        // of malformed template DOM.
        setTemplateEngine(new dummyTemplateEngine({
            myTemplate: "<tr><span data-bind=\"text: 'Some text'\"></span> </tr>" // The whitespace after the closing span is what triggers the strange HTML parsing
        }));
        testNode.innerHTML = "<div data-bind='template: \"myTemplate\"'></div>";
        applyBindings(null, testNode);
        // Since the actual template markup was invalid, we don't really care what the
        // resulting DOM looks like. We are only verifying there were no exceptions.
    });

    it('Should be possible to render a template to a document fragment', function() {
        // Represents https://github.com/knockout/knockout/issues/1162
        // This was failing on IE8
        setTemplateEngine(new dummyTemplateEngine({
            myTemplate: "<p>myval: [js: data.myVal]</p>" // The whitespace after the closing span is what triggers the strange HTML parsing
        }));

        var testDocFrag = document.createDocumentFragment();
        renderTemplate("myTemplate", { myVal: 123 }, null, testDocFrag);

        // Can't use .toContainHtml directly on doc frags, so check DOM structure manually
        expect(testDocFrag.childNodes.length).toEqual(1);
        expect(testDocFrag.childNodes[0].tagName).toEqual("P");
        expect(testDocFrag.childNodes[0]).toContainHtml("myval: 123");
    });
});
