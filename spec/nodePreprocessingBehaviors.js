import {
    options
} from 'tko.utils';

import {
    observable
} from 'tko.observable';

import {
    Provider
} from 'tko.provider';

import { bindings } from 'tko.binding.core';

import {
    applyBindings
} from '../index';

import '../node_modules/tko.utils/helpers/jasmine-13-helper.js';

describe('Node preprocessing', function() {
    beforeEach(jasmine.prepareTestNode);

    beforeEach(function() {
        options.bindingProviderInstance = new Provider();
        options.bindingProviderInstance.bindingHandlers.set(bindings);
    });

    it('Can leave the nodes unchanged by returning a falsey value', function() {
        options.bindingProviderInstance.preprocessNode = function(/* node */) { return null; };
        testNode.innerHTML = "<p data-bind='text: someValue'></p>";
        applyBindings({ someValue: 'hello' }, testNode);
        expect(testNode).toContainText('hello');
    });

    it('Can replace a node with some other node', function() {
        options.bindingProviderInstance.preprocessNode = function(node) {
            // Example: replace <mySpecialNode /> with <span data-bind='text: someValue'></span>
            // This technique could be the basis for implementing custom element types that render templates
            if (node.tagName && node.tagName.toLowerCase() === 'myspecialnode') {
                var newNode = document.createElement("span");
                newNode.setAttribute("data-bind", "text: someValue");
                node.parentNode.insertBefore(newNode, node);
                node.parentNode.removeChild(node);
                return [newNode];
            }
        };
        testNode.innerHTML = "<span>a</span><mySpecialNode></mySpecialNode><span>b</span>";
        var someValue = observable('hello');
        applyBindings({ someValue: someValue }, testNode);
        expect(testNode).toContainText('ahellob');

        // Check that updating the observable has the expected effect
        someValue('goodbye');
        expect(testNode).toContainText('agoodbyeb');
    });

    it('Can replace a node with multiple new nodes', function() {
        options.bindingProviderInstance.preprocessNode = function(node) {
            // Example: Replace {{ someValue }} with text from that property.
            // This could be generalized to full support for string interpolation in text nodes.
            if (node.nodeType === 3 && node.data.indexOf("{{ someValue }}") >= 0) {
                var prefix = node.data.substring(0, node.data.indexOf("{{ someValue }}")),
                    suffix = node.data.substring(node.data.indexOf("{{ someValue }}") + "{{ someValue }}".length),
                    newNodes = [
                        document.createTextNode(prefix),
                        document.createComment("ko text: someValue"),
                        document.createComment("/ko"),
                        document.createTextNode(suffix)
                    ];
                // Manually reimplement ko.utils.replaceDomNodes, since it's not available in minified build
                for (var i = 0; i < newNodes.length; i++) {
                    node.parentNode.insertBefore(newNodes[i], node);
                }
                node.parentNode.removeChild(node);
                return newNodes;
            }
        };
        testNode.innerHTML = "the value is {{ someValue }}.";
        var someValue = observable('hello');
        applyBindings({ someValue: someValue }, testNode);
        expect(testNode).toContainText('the value is hello.');

        // Check that updating the observable has the expected effect
        someValue('goodbye');
        expect(testNode).toContainText('the value is goodbye.');
    });
});
