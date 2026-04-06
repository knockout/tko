import '../helpers/mocha-test-helpers.js'
import { dummyTemplateEngine } from "./templatingBehaviors";

describe('Cross-window support', function() {
    it('Should work in another window', function () {
        var win2 = window.open("", "_blank", "height=150,location=no,menubar=no,toolbar=no,width=250");

        if (!win2) {
            return;
        }

        var blankHtml = '<!doctype html><html><head></head><body></body></html>';
        var previousTemplateEngine = ko.nativeTemplateEngine.instance;

        try {
            win2.document.write(blankHtml);
            win2.document.close();
            var body2 = win2.document.body;

            // renderTemplate
            ko.setTemplateEngine(new dummyTemplateEngine({ someTemplate: "<div data-bind='text: text'></div>" }));
            ko.renderTemplate("someTemplate", { text: 'abc' }, null, body2);
            expect(body2.childNodes.length).to.deep.equal(1);
            expectContainHtml(body2, '<div data-bind="text: text">abc</div>');
            ko.cleanNode(body2);

            // template/foreach binding
            ko.setTemplateEngine(new ko.nativeTemplateEngine());
            body2.innerHTML = "<div id='tmpl'><span data-bind='text: childProp'></span></div><div data-bind='template: {name: \"tmpl\", foreach: someItems}'></div>";
            var someItems = [
                { childProp: 'first child' },
                { childProp: 'second child' }
            ];
            ko.applyBindings({ someItems: someItems }, body2.childNodes[1]);
            expectContainHtml(body2.childNodes[1], '<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span>');
            ko.cleanNode(body2);

            // foreach binding
            body2.innerHTML = "<div data-bind='foreach: someItems'><span data-bind='text: childProp'></span></div>";
            someItems = [
                { childProp: 'first child' },
                { childProp: 'second child' }
            ];
            ko.applyBindings({ someItems: someItems }, body2);
            expectContainHtml(body2.childNodes[0], '<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span>');
            ko.cleanNode(body2);

            // with binding
            var someItem = ko.observable(undefined);
            body2.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: occasionallyExistentChildProp'></span></div>";
            ko.applyBindings({ someItem: someItem }, body2);

            // First it's not there
            expect(body2.childNodes[0].childNodes.length).to.deep.equal(0);

            // Then it's there
            someItem({ occasionallyExistentChildProp: 'Child prop value' });
            expect(body2.childNodes[0].childNodes.length).to.deep.equal(1);
            expectContainText(body2.childNodes[0].childNodes[0], "Child prop value");

            // Then it's gone again
            someItem(null);
            expect(body2.childNodes[0].childNodes.length).to.deep.equal(0);
            ko.cleanNode(body2);
        } finally {
            ko.setTemplateEngine(previousTemplateEngine);
            win2.close();
        }
    });
});
