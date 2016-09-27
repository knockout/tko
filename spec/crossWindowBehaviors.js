
import {
    cleanNode, options
} from 'tko.utils';

import {
    observable
} from 'tko.observable';

import {
    applyBindings
} from 'tko.bind';

import {
    dummyTemplateEngine
} from 'tko.binding.template/helpers/dummyTemplateEngine';

import {
    renderTemplate, setTemplateEngine, templateEngine
} from 'tko.binding.template';

import {
    Provider
} from 'tko.provider';

import {bindings as coreBindings} from 'tko.binding.core';
import {bindings as templateBindings} from 'tko.binding.template';


describe('Cross-window support', function() {

    beforeEach(function () {
        // Set up the default binding handlers.
        var provider = new Provider();
        options.bindingProviderInstance = provider;
        provider.bindingHandlers.set(coreBindings);
        provider.bindingHandlers.set(templateBindings);

        // The dummyTemplateEngine prototype test will fail if we let it just
        // use the one in dummyTemplateEngine.js, because that's imported from
        // the relative node_modules path (and therefore not the same).
        dummyTemplateEngine.prototype = new templateEngine();
    });


    it('Should work in another window', function () {
        var win2 = window.open("/base/spec/blank.html", "_blank", "height=150,location=no,menubar=no,toolbar=no,width=250"),
            body2;

        if (!win2) { return; }

        this.after(function() {
            win2.close();
        });

        window.waitsFor(function () {
            return (win2.document && win2.document.readyState == 'complete' && (body2 = win2.document.body));
        }, 5000);

        window.runs(function () {
            setTemplateEngine(new dummyTemplateEngine({ someTemplate: "<div data-bind='text: text'></div>" }), true);
            renderTemplate("someTemplate", { text: 'abc' }, null, body2);
            expect(body2.childNodes.length).toEqual(1);
            expect(body2).toContainHtml("<div data-bind=\"text: text\">abc</div>");
            cleanNode(body2);
        });

        window.runs(function () {
            body2.innerHTML = "<div data-bind='foreach: someItems'><span data-bind='text: childProp'></span></div>";
            var someItems = [
                { childProp: 'first child' },
                { childProp: 'second child' }
            ];
            applyBindings({ someItems: someItems }, body2);
            expect(body2.childNodes[0]).toContainHtml('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span>');
            cleanNode(body2);
        });

        window.runs(function () {
            var someItem = observable(undefined);
            body2.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: occasionallyExistentChildProp'></span></div>";
            applyBindings({ someItem: someItem }, body2);

            // First it's not there
            expect(body2.childNodes[0].childNodes.length).toEqual(0);

            // Then it's there
            someItem({ occasionallyExistentChildProp: 'Child prop value' });
            expect(body2.childNodes[0].childNodes.length).toEqual(1);
            expect(body2.childNodes[0].childNodes[0]).toContainText("Child prop value");

            // Then it's gone again
            someItem(null);
            expect(body2.childNodes[0].childNodes.length).toEqual(0);
            cleanNode(body2);
        });
    });
});
