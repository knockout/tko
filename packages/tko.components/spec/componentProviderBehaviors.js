
import {
    options
} from 'tko.utils';

import {
    observable, isObservable
} from 'tko.observable';

import {
    applyBindings
} from 'tko.bind';

import {
    Provider
} from 'tko.provider';

import * as components from '../index.js';

import '../node_modules/tko.utils/helpers/jasmine-13-helper.js';


describe("Components", function() {
    var assert = window.assert;
    var bindingHandlers;

    describe("custom elements", function() {
        // Note: knockout/spec/components
        beforeEach(function() {
            options.bindingProviderInstance = new Provider();
            bindingHandlers.set({ component: components.bindingHandler });
        });

        it("inserts templates into custom elements", function(done) {
            components.register('helium', {
                template: 'X<i data-sbind="text: 123"></i>'
            });
            var initialMarkup = 'He: <helium></helium>';
            var root = document.createElement("div");
            root.innerHTML = initialMarkup;

            // Since components are loaded asynchronously, it doesn't show up synchronously
            applyBindings(null, root);
            assert.equal(root.innerHTML, initialMarkup);
            setTimeout(function() {
                window.root = root;
                assert.equal(root.innerHTML,
                    'He: <helium>X<i data-sbind="text: 123">123</i></helium>'
                );
                done();
            }, 1);
        });

        it("interprets the params of custom elements", function(done) {
            var called = false;
            components.register("argon", {
                viewModel: function(/* params */) {
                    this.delta = 'G2k';
                    called = true;
                },
                template: "<b>sXZ <u data-sbind='text: delta'></u></b>"
            });
            var ce = document.createElement("argon");
            ce.setAttribute("params",
                "alpha: 1, beta: [2], charlie: {x: 3}, delta: delta"
            );
            applyBindings({
                delta: 'QxE'
            }, ce);
            setTimeout(function() {
                assert.equal(ce.innerHTML,
                    '<b>sXZ <u data-sbind="text: delta">G2k</u></b>');
                assert.equal(called, true);
                done();
            }, 1);
        });

        it("does not unwrap observables (#44)", function(done) {
            // Per https://plnkr.co/edit/EzpJD3yXd01aqPbuOq1X
            function AppViewModel(value) {
                this.appvalue = observable(value);
            }

            function ParentViewModel(params) {
                this.parentvalue = params.value;
            }

            function ChildViewModel(params) {
                assert.ok(isObservable(params.value));
                this.cvalue = params.value;
            }

            var ps = document.createElement('script');
            ps.setAttribute('id', 'parent-44');
            ps.setAttribute('type', 'text/html');
            ps.innerHTML = '<div>Parent: <span data-bind="text: parentvalue"></span></div>' +
                '<child params="value: parentvalue"></child>';
            document.body.appendChild(ps);

            var cs = document.createElement('script');
            cs.setAttribute('id', 'child-44');
            cs.setAttribute('type', 'text/html');
            cs.innerHTML = '';
            document.body.appendChild(cs);

            var div = document.createElement('div');
            div.innerHTML = '<div data-bind="text: appvalue"></div>' +
                '<parent params="value: appvalue"></parent>';

            var viewModel = new AppViewModel("hello");
            components.register("parent", {
                template: {
                    element: "parent-44"
                },
                viewModel: ParentViewModel
            });
            components.register("child", {
                template: {
                    element: "child-44"
                },
                viewModel: ChildViewModel
            });
            var options = {
                attribute: "data-bind",
                globals: window,
                bindings: bindingHandlers,
                noVirtualElements: false
            };
            options.bindingProviderInstance = new Provider(options);
            applyBindings(viewModel, div);
            setTimeout(function() {
                done();
            }, 50);
        });

        it("uses empty params={$raw:{}} if the params attr is whitespace", function(done) {
            // var called = false;
            components.register("lithium", {
                viewModel: function(params) {
                    assert.deepEqual(params, {
                        $raw: {}
                    });
                    done();
                },
                template: "hello"
            });
            var ce = document.createElement("lithium");
            ce.setAttribute("params", "   ");
            applyBindings({
                delta: 'QxE'
            }, ce);
            // No error raised.
        });

        it('parses `text: "alpha"` on a custom element', function(done) {
            // re brianmhunt/knockout-secure-binding#38
            components.register("neon", {
                viewModel: function(params) {
                    assert.equal(params.text, "Knights of Ne.");
                    done();
                },
                template: "A noble gas and less noble car."
            });
            var ne = document.createElement("neon");
            ne.setAttribute("params", 'text: "Knights of Ne."');
            applyBindings({}, ne);
            // No error raised.
        });
    });

    /*describe("nodeParamsToObject", function() {
        // var parser = null;
        beforeEach(function() {

        });
        it("returns {$raw:{}} when there is no params attribute", function() {
            var parser = new Parser(null, {});
            var node = document.createElement("div");
            assert.deepEqual(nodeParamsToObject(node, parser), {
                $raw: {}
            });
        });

        it("returns the params items", function() {
            var parser = new Parser(null, {});
            var node = document.createElement("div");
            node.setAttribute('params', 'value: "42.99"');
            var expect = {
                value: "42.99",
                $raw: {
                    value: "42.99"
                }
            };
            assert.deepEqual(toJS(nodeParamsToObject(node, parser)), expect);
        });

        it("returns unwrapped params", function() {
            var parser = new Parser(null, {
                fe: observable('Iron')
            });
            var node = document.createElement("div");
            node.setAttribute('params', 'type: fe');
            var paramsObject = nodeParamsToObject(node, parser);
            assert.equal(paramsObject.type(), "Iron");
            assert.equal(paramsObject.$raw.type()(), "Iron");
        });
    }); // */
});
