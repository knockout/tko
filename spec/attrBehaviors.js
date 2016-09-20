import {
    arrayForEach
} from 'tko.utils';

import {
    applyBindings
} from 'tko.bind';

import {
    observable
} from 'tko.observable';

import {
    Provider
} from 'tko.provider';

import {
    options
} from 'tko.utils';

import * as coreBindings from '../index.js';

import '../node_modules/tko.utils/helpers/jasmine-13-helper.js';

describe('Binding: Attr', function() {
    beforeEach(jasmine.prepareTestNode);

    beforeEach(function(){
        var provider = new Provider();
        options.bindingProviderInstance = provider;
        provider.bindingHandlers.set(coreBindings.bindings);
    });

    it('Should be able to set arbitrary attribute values', function() {
        var model = { myValue: "first value" };
        testNode.innerHTML = "<div data-bind='attr: {firstAttribute: myValue, \"second-attribute\": true}'></div>";
        applyBindings(model, testNode);
        expect(testNode.childNodes[0].getAttribute("firstAttribute")).toEqual("first value");
        expect(testNode.childNodes[0].getAttribute("second-attribute")).toEqual("true");
    });

    it('Should be able to set \"name\" attribute, even on IE6-7', function() {
        var myValue = observable("myName");
        testNode.innerHTML = "<input data-bind='attr: { name: myValue }' />";
        applyBindings({ myValue: myValue }, testNode);
        expect(testNode.childNodes[0].name).toEqual("myName");
        if (testNode.childNodes[0].outerHTML) { // Old Firefox doesn't support outerHTML
            expect(testNode.childNodes[0].outerHTML).toMatch('name="?myName"?');
        }
        expect(testNode.childNodes[0].getAttribute("name")).toEqual("myName");

        // Also check we can remove it (which, for a name attribute, means setting it to an empty string)
        myValue(false);
        expect(testNode.childNodes[0].name).toEqual("");
        if (testNode.childNodes[0].outerHTML) { // Old Firefox doesn't support outerHTML
            expect(testNode.childNodes[0].outerHTML).toNotMatch('name="?([^">]+)');
        }
        expect(testNode.childNodes[0].getAttribute("name")).toEqual("");
    });

    it('Should respond to changes in an observable value', function() {
        var model = { myprop : observable("initial value") };
        testNode.innerHTML = "<div data-bind='attr: { someAttrib: myprop }'></div>";
        applyBindings(model, testNode);
        expect(testNode.childNodes[0].getAttribute("someAttrib")).toEqual("initial value");

        // Change the observable; observe it reflected in the DOM
        model.myprop("new value");
        expect(testNode.childNodes[0].getAttribute("someAttrib")).toEqual("new value");
    });

    it('Should remove the attribute if the value is strictly false, null, or undefined', function() {
        var model = { myprop : observable() };
        testNode.innerHTML = "<div data-bind='attr: { someAttrib: myprop }'></div>";
        applyBindings(model, testNode);
        arrayForEach([false, null, undefined], function(testValue) {
            model.myprop("nonempty value");
            expect(testNode.childNodes[0].getAttribute("someAttrib")).toEqual("nonempty value");
            model.myprop(testValue);
            expect(testNode.childNodes[0].getAttribute("someAttrib")).toEqual(null);
        });
    });

    it('Should be able to set class attribute and access it using className property', function() {
        var model = { myprop : observable("newClass") };
        testNode.innerHTML = "<div class='oldClass' data-bind=\"attr: {'class': myprop}\"></div>";
        expect(testNode.childNodes[0].className).toEqual("oldClass");
        applyBindings(model, testNode);
        expect(testNode.childNodes[0].className).toEqual("newClass");
        // Should be able to clear class also
        model.myprop(undefined);
        expect(testNode.childNodes[0].className).toEqual("");
        expect(testNode.childNodes[0].getAttribute("class")).toEqual(null);
    });
});
