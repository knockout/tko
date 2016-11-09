/* eslint semi: 0 */

import {
    triggerEvent, options
} from 'tko.utils';

import {
    applyBindings
} from 'tko.bind';

import {
    observable as Observable
} from 'tko.observable';

import {
    Provider
} from 'tko.provider';

import {
    bindings as coreBindings
} from 'tko.binding.core';

import {
    preprocessors
} from '../index.js';

import 'tko.utils/helpers/jasmine-13-helper.js';


var attributeInterpolationMarkup = preprocessors[1]

describe("Attribute Interpolation Markup preprocessor", function() {
    var testNode, provider;

    beforeEach(function () {
        testNode = document.createElement("div");
        provider = new Provider();
        provider.bindingHandlers.set(coreBindings);
    });

    it('Should do nothing when there are no expressions', function() {
        testNode.setAttribute('title', "some text");
        attributeInterpolationMarkup.nodePreProcessor(testNode, provider);
        expect(testNode.title).toEqual('some text');
        expect(testNode.getAttribute('data-bind')).toBe(null);
    });

    it('Should do nothing when empty', function() {
        testNode.setAttribute('title', "");
        attributeInterpolationMarkup.nodePreProcessor(testNode, provider);
        expect(testNode.title).toEqual('');
        expect(testNode.getAttribute('data-bind')).toBe(null);
    });

    it('Should not parse unclosed binding', function() {
        testNode.setAttribute('title', "some {{text");
        attributeInterpolationMarkup.nodePreProcessor(testNode, provider);
        expect(testNode.title).toEqual('some {{text');
        expect(testNode.getAttribute('data-bind')).toBe(null);
    });

    it('Should not parse unopened binding', function() {
        testNode.setAttribute('title', "some}} text");
        attributeInterpolationMarkup.nodePreProcessor(testNode, provider);
        expect(testNode.title).toEqual('some}} text');
        expect(testNode.getAttribute('data-bind')).toBe(null);
    });

    it('Should create binding from {{...}} expression', function() {
        testNode.setAttribute('title', "some {{expr}} text");
        attributeInterpolationMarkup.nodePreProcessor(testNode, provider);
        expect(testNode.title).toEqual('');
        expect(testNode.getAttribute('data-bind')).toEqual('attr.title:""+"some "+@(expr)+" text"');
    });

    it('Should ignore unmatched delimiters', function() {
        testNode.setAttribute('title', "some {{expr1}}expr2}} text");
        attributeInterpolationMarkup.nodePreProcessor(testNode, provider);
        expect(testNode.title).toEqual('');
        expect(testNode.getAttribute('data-bind')).toEqual('attr.title:""+"some "+@(expr1}}expr2)+" text"');
    });

    it('Should support two expressions', function() {
        testNode.setAttribute('title', "some {{expr1}} middle {{expr2}} text");
        attributeInterpolationMarkup.nodePreProcessor(testNode, provider);
        expect(testNode.title).toEqual('');
        expect(testNode.getAttribute('data-bind')).toEqual('attr.title:""+"some "+@(expr1)+" middle "+@(expr2)+" text"');
    });

    it('Should skip empty text', function() {
        testNode.setAttribute('title', "{{expr1}}{{expr2}}");
        attributeInterpolationMarkup.nodePreProcessor(testNode, provider);
        expect(testNode.title).toEqual('');
        expect(testNode.getAttribute('data-bind')).toEqual('attr.title:""+@(expr1)+@(expr2)');
    });

    it('Should support more than two expressions', function() {
        testNode.setAttribute('title', "x {{expr1}} y {{expr2}} z {{expr3}}");
        attributeInterpolationMarkup.nodePreProcessor(testNode, provider);
        expect(testNode.title).toEqual('');
        expect(testNode.getAttribute('data-bind')).toEqual('attr.title:""+"x "+@(expr1)+" y "+@(expr2)+" z "+@(expr3)');
    });

    it('Should create simple binding for single expression', function() {
        testNode.setAttribute('title', "{{expr1}}");
        attributeInterpolationMarkup.nodePreProcessor(testNode, provider);
        expect(testNode.title).toEqual('');
        expect(testNode.getAttribute('data-bind')).toEqual('attr.title:expr1');
    });

    it('Should append to existing data-bind', function() {
        testNode.setAttribute('title', "{{expr1}}");
        testNode.setAttribute('data-bind', "text:expr2");
        attributeInterpolationMarkup.nodePreProcessor(testNode, provider);
        expect(testNode.title).toEqual('');
        expect(testNode.getAttribute('data-bind')).toEqual('text:expr2,attr.title:expr1');
    });

    it('Should not match expressions in data-bind', function() {
        testNode.setAttribute('data-bind', "text:'{{xyz}}'");
        attributeInterpolationMarkup.nodePreProcessor(testNode, provider);
        expect(testNode.getAttribute('data-bind')).toEqual("text:'{{xyz}}'");
    });

    it('Should support expressions in multiple attributes', function() {
        testNode.setAttribute('title', "{{expr1}}");
        testNode.setAttribute('class', "test");     // won't be in data-bind
        testNode.setAttribute('id', "{{expr2}}");
        testNode.setAttribute('data-test', "{{expr3}}");
        attributeInterpolationMarkup.nodePreProcessor(testNode, provider);
        expect(testNode.getAttribute('data-bind')).toEqual('attr.title:expr1,attr.id:expr2,attr.data-test:expr3'); // the order shouldn't matter
    });

    it('Should convert value and checked attributes to two-way bindings', function() {
        var input = document.createElement('input');
        input.type = 'checkbox';
        input.setAttribute('checked', "{{expr2}}");
        input.setAttribute('value', "{{expr1}}");
        attributeInterpolationMarkup.nodePreProcessor(input, provider);
        expect(input.getAttribute('data-bind')).toEqual('checked:expr2,value:expr1');
    });

    it('Should support custom attribute binding using "attributeBinding" extension point', function() {
        var originalAttributeBinding = attributeInterpolationMarkup.attributeBinding;
        this.after(function() {
            attributeInterpolationMarkup.attributeBinding = originalAttributeBinding;
        });

        attributeInterpolationMarkup.attributeBinding = function(name, value, node) {
            var parsedName = name.match(/^ko-(.*)$/);
            if (parsedName) {
                return originalAttributeBinding(parsedName[1], value, node);
            }
        }
        // Won't be in data-bind because it doesn't include an expression
        testNode.setAttribute('ko-class', "test");
        // Should handle normal attributes normally
        testNode.setAttribute('title', "{{expr1}}");
        // This will use the custom handler
        testNode.setAttribute('ko-id', "{{expr2}}");
        attributeInterpolationMarkup.nodePreProcessor(testNode, provider);
        expect(testNode.getAttribute('data-bind')).toEqual('attr.title:expr1,attr.id:expr2');
    });
});


describe("Attribute Interpolation Markup bindings", function() {
    beforeEach(jasmine.prepareTestNode);

    var bindingHandlers;

    beforeEach(function(){
        var provider = new Provider();
        provider.addNodePreprocessor(attributeInterpolationMarkup.nodePreProcessor);
        options.bindingProviderInstance = provider;
        bindingHandlers = provider.bindingHandlers;
        bindingHandlers.set(coreBindings);
    });

    it('Should replace {{...}} expression in attribute', function() {
        testNode.innerHTML = "<div title='hello {{\"name\"}}!'></div>";
        applyBindings(null, testNode);
        expect(testNode.childNodes[0].title).toEqual("hello name!");
    });

    it('Should replace multiple expressions', function() {
        testNode.innerHTML = "<div title='hello {{\"name\"}}{{\"!\"}}'></div>";
        applyBindings(null, testNode);
        expect(testNode.childNodes[0].title).toEqual("hello name!");
    });

    xit('Should support any content of expression, including functions and {{}}', function() {
        // Disabled, since we can't properly `eval` the internals.
        // TODO/FIXME: Check lambdas.
        testNode.innerHTML = "<div title='hello {{ => \"{{name}}\" }}!'></div>";
        applyBindings(null, testNode);
        expect(testNode.childNodes[0].title).toEqual("hello {{name}}!");
    });

    it('Should properly handle quotes in text sections', function() {
        testNode.innerHTML = "<div title='This is \"great\" {{\"fun\"}} with &apos;friends&apos;'></div>";
        applyBindings(null, testNode);
        expect(testNode.childNodes[0].title).toEqual("This is \"great\" fun with 'friends'");
    });

    it('Should ignore unmatched }} and {{', function() {
        testNode.innerHTML = "<div title='hello }}\"name\"{{\"!\"}}{{'></div>";
        applyBindings(null, testNode);
        expect(testNode.childNodes[0].title).toEqual("hello }}\"name\"!{{");
    });

    it('Should support expressions in multiple attributes', function() {
        testNode.innerHTML = "<div title='{{title}}' id='{{id}}' class='test class' data-test='hello {{\"name\"}}!' data-bind='text:content'></div>";
        applyBindings({title: 'the title', id: 'test id', content: 'content'}, testNode);
        expect(testNode).toContainText("content");
        expect(testNode.childNodes[0].title).toEqual("the title");
        expect(testNode.childNodes[0].id).toEqual("test id");
        expect(testNode.childNodes[0].className).toEqual("test class");
        expect(testNode.childNodes[0].getAttribute('data-test')).toEqual("hello name!");
    });

    it('Should update when observable changes', function() {
        testNode.innerHTML = "<div title='The best {{what}}.'></div>";
        var observable = Observable('time');
        applyBindings({what: observable}, testNode);
        expect(testNode.childNodes[0].title).toEqual("The best time.");
        observable('fun');
        expect(testNode.childNodes[0].title).toEqual("The best fun.");
    });

    it('Should convert value attribute to two-way binding', function() {
        testNode.innerHTML = "<input value='{{value}}'/>";
        var observable = Observable('default value');
        applyBindings({value: observable}, testNode);
        expect(testNode.childNodes[0].value).toEqual("default value");

        testNode.childNodes[0].value = 'user-enterd value';
        triggerEvent(testNode.childNodes[0], 'change');
        expect(observable()).toEqual("user-enterd value");
    });

    it('Should convert checked attribute to two-way binding', function() {
        testNode.innerHTML = "<input type='checkbox' checked='{{isChecked}}'/>";
        var observable = Observable(true);
        applyBindings({isChecked: observable}, testNode);
        expect(testNode.childNodes[0].checked).toBe(true);

        testNode.childNodes[0].click();
        expect(observable()).toBe(false);
    });
});