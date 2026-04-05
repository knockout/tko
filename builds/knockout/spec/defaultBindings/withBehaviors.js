describe('Binding: With', function() {
    beforeEach(prepareTestNode);

    it('Should remove descendant nodes from the document (and not bind them) if the value is falsy', function() {
        testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: someItem.nonExistentChildProp'></span></div>";
        expect(testNode.childNodes[0].childNodes.length).to.deep.equal(1);
        ko.applyBindings({ someItem: null }, testNode);
        expect(testNode.childNodes[0].childNodes.length).to.deep.equal(0);
    });

    it('Should leave descendant nodes in the document (and bind them in the context of the supplied value) if the value is truthy', function() {
        testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: existentChildProp'></span></div>";
        expect(testNode.childNodes.length).to.deep.equal(1);
        ko.applyBindings({ someItem: { existentChildProp: 'Child prop value' } }, testNode);
        expect(testNode.childNodes[0].childNodes.length).to.deep.equal(1);
        expectContainText(testNode.childNodes[0].childNodes[0], "Child prop value");
    });

    it('Should leave descendant nodes unchanged if the value is truthy', function() {
        var someItem = ko.observable({ childProp: 'child prop value' });
        testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: childProp'></span></div>";
        var originalNode = testNode.childNodes[0].childNodes[0];

        // Value is initially true, so nodes are retained
        ko.applyBindings({ someItem: someItem }, testNode);
        expectContainText(testNode.childNodes[0].childNodes[0], "child prop value");
        expect(testNode.childNodes[0].childNodes[0]).to.deep.equal(originalNode);
    });

    it('Should toggle the presence and bindedness of descendant nodes according to the truthiness of the value, performing binding in the context of the value', function() {
        var someItem = ko.observable(undefined);
        testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: occasionallyExistentChildProp'></span></div>";
        ko.applyBindings({ someItem: someItem }, testNode);

        // First it's not there
        expect(testNode.childNodes[0].childNodes.length).to.deep.equal(0);

        // Then it's there
        someItem({ occasionallyExistentChildProp: 'Child prop value' });
        expect(testNode.childNodes[0].childNodes.length).to.deep.equal(1);
        expectContainText(testNode.childNodes[0].childNodes[0], "Child prop value");

        // Then it's gone again
        someItem(null);
        expect(testNode.childNodes[0].childNodes.length).to.deep.equal(0);
    });

    it('Should reconstruct and bind descendants when the data item notifies about mutation', function() {
        var someItem = ko.observable({ childProp: 'Hello' });

        testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: childProp'></span></div>";
        ko.applyBindings({ someItem: someItem }, testNode);
        expectContainText(testNode.childNodes[0].childNodes[0], "Hello");

        // Force "update" binding handler to fire, then check the DOM changed
        someItem().childProp = 'Goodbye';
        someItem.valueHasMutated();
        expectContainText(testNode.childNodes[0].childNodes[0], "Goodbye");
    });

    it('Should not bind the same elements more than once even if the supplied value notifies a change', function() {
        var countedClicks = 0;
        var someItem = ko.observable({
            childProp: ko.observable('Hello'),
            handleClick: function() { countedClicks++ }
        });

        testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: childProp, click: handleClick'></span></div>";
        ko.applyBindings({ someItem: someItem }, testNode);

        // Initial state is one subscriber, one click handler
        expectContainText(testNode.childNodes[0].childNodes[0], "Hello");
        expect(someItem().childProp.getSubscriptionsCount()).to.deep.equal(1);
        ko.utils.triggerEvent(testNode.childNodes[0].childNodes[0], "click");
        expect(countedClicks).to.deep.equal(1);

        // Force "update" binding handler to fire, then check we still have one subscriber...
        someItem.valueHasMutated();
        expect(someItem().childProp.getSubscriptionsCount()).to.deep.equal(1);

        // ... and one click handler
        countedClicks = 0;
        ko.utils.triggerEvent(testNode.childNodes[0].childNodes[0], "click");
        expect(countedClicks).to.deep.equal(1);
    });

    it('Should be able to access parent binding context via $parent', function() {
        testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: $parent.parentProp'></span></div>";
        ko.applyBindings({ someItem: { }, parentProp: 'Parent prop value' }, testNode);
        expectContainText(testNode.childNodes[0].childNodes[0], "Parent prop value");
    });

    it('Should be able to access all parent binding contexts via $parents, and root context via $root', function() {
        testNode.innerHTML = "<div data-bind='with: topItem'>" +
                                "<div data-bind='with: middleItem'>" +
                                    "<div data-bind='with: bottomItem'>" +
                                        "<span data-bind='text: name'></span>" +
                                        "<span data-bind='text: $parent.name'></span>" +
                                        "<span data-bind='text: $parents[1].name'></span>" +
                                        "<span data-bind='text: $parents[2].name'></span>" +
                                        "<span data-bind='text: $root.name'></span>" +
                                    "</div>" +
                                "</div>" +
                              "</div>";
        ko.applyBindings({
            name: 'outer',
            topItem: {
                name: 'top',
                middleItem: {
                    name: 'middle',
                    bottomItem: {
                        name: "bottom"
                    }
                }
            }
        }, testNode);
        var finalContainer = testNode.childNodes[0].childNodes[0].childNodes[0];
        expectContainText(finalContainer.childNodes[0], "bottom");
        expectContainText(finalContainer.childNodes[1], "middle");
        expectContainText(finalContainer.childNodes[2], "top");
        expectContainText(finalContainer.childNodes[3], "outer");
        expectContainText(finalContainer.childNodes[4], "outer");

        // Also check that, when we later retrieve the binding contexts, we get consistent results
        expect(ko.contextFor(testNode).$data.name).to.deep.equal("outer");
        expect(ko.contextFor(testNode.childNodes[0]).$data.name).to.deep.equal("outer");
        expect(ko.contextFor(testNode.childNodes[0].childNodes[0]).$data.name).to.deep.equal("top");
        expect(ko.contextFor(testNode.childNodes[0].childNodes[0].childNodes[0]).$data.name).to.deep.equal("middle");
        expect(ko.contextFor(testNode.childNodes[0].childNodes[0].childNodes[0].childNodes[0]).$data.name).to.deep.equal("bottom");
        var firstSpan = testNode.childNodes[0].childNodes[0].childNodes[0].childNodes[0];
        expect(firstSpan.tagName).to.deep.equal("SPAN");
        expect(ko.contextFor(firstSpan).$data.name).to.deep.equal("bottom");
        expect(ko.contextFor(firstSpan).$root.name).to.deep.equal("outer");
        expect(ko.contextFor(firstSpan).$parents[1].name).to.deep.equal("top");
    });

    it('Should be able to access all parent bindings when using "as" when "createChildContextWithAs" is set', function() {
        this.restoreAfter(ko.options, 'createChildContextWithAs');
        ko.options.createChildContextWithAs = true;

        testNode.innerHTML = "<div data-bind='with: topItem'>" +
                                "<div data-bind='with: middleItem, as: \"middle\"'>" +
                                    "<div data-bind='with: bottomItem'>" +
                                        "<span data-bind='text: name'></span>" +
                                        "<span data-bind='text: $parent.name'></span>" +
                                        "<span data-bind='text: middle.name'></span>" +
                                        "<span data-bind='text: $parents[1].name'></span>" +
                                        "<span data-bind='text: $parents[2].name'></span>" +
                                        "<span data-bind='text: $root.name'></span>" +
                                    "</div>" +
                                "</div>" +
                              "</div>";
        ko.applyBindings({
            name: 'outer',
            topItem: {
                name: 'top',
                middleItem: {
                    name: 'middle',
                    bottomItem: {
                        name: "bottom"
                    }
                }
            }
        }, testNode);
        var finalContainer = testNode.childNodes[0].childNodes[0].childNodes[0];
        expectContainText(finalContainer.childNodes[0], "bottom");
        expectContainText(finalContainer.childNodes[1], "middle");
        expectContainText(finalContainer.childNodes[2], "middle");
        expectContainText(finalContainer.childNodes[3], "top");
        expectContainText(finalContainer.childNodes[4], "outer");
        expectContainText(finalContainer.childNodes[5], "outer");
    });

    it('Should be able to define an \"with\" region using a containerless template', function() {
        var someitem = ko.observable(undefined);
        testNode.innerHTML = "hello <!-- ko with: someitem --><span data-bind=\"text: occasionallyexistentchildprop\"></span><!-- /ko --> goodbye";
        ko.applyBindings({ someitem: someitem }, testNode);

        // First it's not there
        expectContainHtml(testNode, "hello <!-- ko with: someitem --><!-- /ko --> goodbye");

        // Then it's there
        someitem({ occasionallyexistentchildprop: 'child prop value' });
        expectContainHtml(testNode, "hello <!-- ko with: someitem --><span data-bind=\"text: occasionallyexistentchildprop\">child prop value</span><!-- /ko --> goodbye");

        // Then it's gone again
        someitem(null);
        expectContainHtml(testNode, "hello <!-- ko with: someitem --><!-- /ko --> goodbye");
    });

    it('Should be able to nest \"with\" regions defined by containerless templates', function() {
        testNode.innerHTML = "hello <!-- ko with: topitem -->"
                               + "Got top: <span data-bind=\"text: topprop\"></span>"
                               + "<!-- ko with: childitem -->"
                                   + "Got child: <span data-bind=\"text: childprop\"></span>"
                               + "<!-- /ko -->"
                           + "<!-- /ko -->";
        var viewModel = { topitem: ko.observable(null) };
        ko.applyBindings(viewModel, testNode);

        // First neither are there
        expectContainHtml(testNode, "hello <!-- ko with: topitem --><!-- /ko -->");

        // Make top appear
        viewModel.topitem({ topprop: 'property of top', childitem: ko.observable() });
        expectContainHtml(testNode, "hello <!-- ko with: topitem -->got top: <span data-bind=\"text: topprop\">property of top</span><!-- ko with: childitem --><!-- /ko --><!-- /ko -->");

        // Make child appear
        viewModel.topitem().childitem({ childprop: 'property of child' });
        expectContainHtml(testNode, "hello <!-- ko with: topitem -->got top: <span data-bind=\"text: topprop\">property of top</span><!-- ko with: childitem -->got child: <span data-bind=\"text: childprop\">property of child</span><!-- /ko --><!-- /ko -->");

        // Make top disappear
        viewModel.topitem(null);
        expectContainHtml(testNode, "hello <!-- ko with: topitem --><!-- /ko -->");
    });

    it('Should provide access to an observable viewModel through $rawData', function() {
        testNode.innerHTML = "<div data-bind='with: item'><input data-bind='value: $rawData'/><div data-bind='text: $data'></div></div>";
        var item = ko.observable('one');
        ko.applyBindings({ item: item }, testNode);
        expect(item.getSubscriptionsCount('change')).to.deep.equal(3);    // subscriptions are the with and value bindings, and the binding context
        expectHaveValues(testNode.childNodes[0], ['one']);
        expectContainText(testNode.childNodes[0].childNodes[1], 'one');

        // Should update observable when input is changed
        testNode.childNodes[0].childNodes[0].value = 'two';
        ko.utils.triggerEvent(testNode.childNodes[0].childNodes[0], "change");
        expect(item()).to.deep.equal('two');
        expectContainText(testNode.childNodes[0].childNodes[1], 'two');

        // Should update the input when the observable changes
        item('three');
        expectHaveValues(testNode.childNodes[0], ['three']);
        expectContainText(testNode.childNodes[0].childNodes[1], 'three');

        // subscription count is stable
        expect(item.getSubscriptionsCount('change')).to.deep.equal(3);
    });

    it('Should update if given a function', function () {
        // See knockout/knockout#2285
        testNode.innerHTML = '<div data-bind="with: getTotal"><div data-bind="text: $data"></div>';

        function ViewModel() {
            var self = this;
            self.items = ko.observableArray([{ x: ko.observable(4) }])
            self.getTotal = function() {
                var total = 0;
                ko.utils.arrayForEach(self.items(), function(item) { total += item.x();});
                return total;
            }
        }

        var model = new ViewModel();
        ko.applyBindings(model, testNode);
        expectContainText(testNode, "4");

        model.items.push({ x: ko.observable(15) });
        expectContainText(testNode, "19");

        model.items()[0].x(10);
        expectContainText(testNode, "25");
    });

    it('Should call a childrenComplete callback function', function () {
        testNode.innerHTML = "<div data-bind='with: someItem, childrenComplete: callback'><span data-bind='text: childprop'></span></div>";
        var someItem = ko.observable({ childprop: 'child' }),
            callbacks = 0;
        ko.applyBindings({ someItem: someItem, callback: function () { callbacks++; } }, testNode);
        expect(callbacks).to.deep.equal(1);
        expectContainText(testNode.childNodes[0], 'child');

        someItem(null);
        expect(callbacks).to.deep.equal(1);
        expect(testNode.childNodes[0].childNodes.length).to.deep.equal(0);

        someItem({ childprop: "new child" });
        expect(callbacks).to.deep.equal(2);
        expectContainText(testNode.childNodes[0], 'new child');
    });

    describe('With "createChildContextWithAs = false" and "as"', function () {
        beforeEach(function() {
            this.restoreAfter(ko.options, 'createChildContextWithAs');
            ko.options.createChildContextWithAs = false;
        });

        it('Should not create a child context', function () {
            testNode.innerHTML = "<div data-bind='with: someItem, as: \"item\"'><span data-bind='text: item.childProp'></span></div>";
            var someItem = { childProp: 'Hello' };
            ko.applyBindings({ someItem: someItem }, testNode);

            expectContainText(testNode.childNodes[0].childNodes[0], 'Hello');
            expect(ko.dataFor(testNode.childNodes[0].childNodes[0])).to.deep.equal(ko.dataFor(testNode));
        });

        it('Should provide access to observable value', function() {
            testNode.innerHTML = "<div data-bind='with: someItem, as: \"item\"'><input data-bind='value: item'/></div>";
            var someItem = ko.observable('Hello');
            ko.applyBindings({ someItem: someItem }, testNode);
            expect(testNode.childNodes[0].childNodes[0].value).to.deep.equal('Hello');

            expect(ko.dataFor(testNode.childNodes[0].childNodes[0])).to.deep.equal(ko.dataFor(testNode));

            // Should update observable when input is changed
            testNode.childNodes[0].childNodes[0].value = 'Goodbye';
            ko.utils.triggerEvent(testNode.childNodes[0].childNodes[0], "change");
            expect(someItem()).to.deep.equal('Goodbye');

            // Should update the input when the observable changes
            someItem('Hello again');
            expect(testNode.childNodes[0].childNodes[0].value).to.deep.equal('Hello again');
        });

        it('Should not re-render the nodes when an observable value changes', function() {
            testNode.innerHTML = "<div data-bind='with: someItem, as: \"item\"'><span data-bind='text: item'></span></div>";
            var someItem = ko.observable('first');
            ko.applyBindings({ someItem: someItem }, testNode);
            expectContainText(testNode.childNodes[0], 'first');

            var saveNode = testNode.childNodes[0].childNodes[0];
            someItem('second');
            expectContainText(testNode.childNodes[0], 'second');
            expect(testNode.childNodes[0].childNodes[0]).to.deep.equal(saveNode);
        });

        it('Should remove nodes when an observable value become falsy', function() {
            var someItem = ko.observable(undefined);
            testNode.innerHTML = "<div data-bind='with: someItem, as: \"item\"'><span data-bind='text: item().occasionallyExistentChildProp'></span></div>";
            ko.applyBindings({ someItem: someItem }, testNode);

            // First it's not there
            expect(testNode.childNodes[0].childNodes.length).to.deep.equal(0);

            // Then it's there
            someItem({ occasionallyExistentChildProp: 'Child prop value' });
            expect(testNode.childNodes[0].childNodes.length).to.deep.equal(1);
            expectContainText(testNode.childNodes[0].childNodes[0], "Child prop value");

            // Then it's gone again
            someItem(null);
            expect(testNode.childNodes[0].childNodes.length).to.deep.equal(0);
        });
    });

    describe('With "createChildContextWithAs = true" and "as"', function () {
        beforeEach(function() {
            this.restoreAfter(ko.options, 'createChildContextWithAs');
            ko.options.createChildContextWithAs = true;
        });

        it('Should create a child context', function () {
            testNode.innerHTML = "<div data-bind='with: someItem, as: \"item\"'><span data-bind='text: item.childProp'></span></div>";
            var someItem = { childProp: 'Hello' };
            ko.applyBindings({ someItem: someItem }, testNode);

            expectContainText(testNode.childNodes[0].childNodes[0], 'Hello');
            expect(ko.dataFor(testNode.childNodes[0].childNodes[0])).to.deep.equal(someItem);
        });

        it('Should unwrap observable value', function() {
            testNode.innerHTML = "<div data-bind='with: someItem, as: \"item\"'><input data-bind='value: item'/><input data-bind='value: $rawData'/></div>";
            var someItem = ko.observable('Hello');
            ko.applyBindings({ someItem: someItem }, testNode);
            expectHaveValues(testNode.childNodes[0], ['Hello', 'Hello']);

            // Should not update observable when input bound to named item is changed
            testNode.childNodes[0].childNodes[0].value = 'Goodbye';
            ko.utils.triggerEvent(testNode.childNodes[0].childNodes[0], "change");
            expect(someItem()).to.deep.equal('Hello');

            // Should update observable when input bound to $rawData is changed
            testNode.childNodes[0].childNodes[1].value = 'Goodbye';
            ko.utils.triggerEvent(testNode.childNodes[0].childNodes[1], "change");
            expect(someItem()).to.deep.equal('Goodbye');

            // Should update the input when the observable changes
            someItem('Hello again');
            expect(testNode.childNodes[0].childNodes[0].value).to.deep.equal('Hello again');
        });

        it('Should re-render the nodes when an observable value changes', function() {
            testNode.innerHTML = "<div data-bind='with: someItem, as: \"item\"'><span data-bind='text: item'></span></div>";
            var someItem = ko.observable('first');
            ko.applyBindings({ someItem: someItem }, testNode);
            expectContainText(testNode.childNodes[0], 'first');

            var saveNode = testNode.childNodes[0].childNodes[0];
            someItem('second');
            expectContainText(testNode.childNodes[0], 'second');
            expect(testNode.childNodes[0].childNodes[0]).not.to.deep.equal(saveNode);
        });

        it('Should remove nodes when an observable value become falsy', function() {
            var someItem = ko.observable(undefined);
            testNode.innerHTML = "<div data-bind='with: someItem, as: \"item\"'><span data-bind='text: item.occasionallyExistentChildProp'></span></div>";
            ko.applyBindings({ someItem: someItem }, testNode);

            // First it's not there
            expect(testNode.childNodes[0].childNodes.length).to.deep.equal(0);

            // Then it's there
            someItem({ occasionallyExistentChildProp: 'Child prop value' });
            expect(testNode.childNodes[0].childNodes.length).to.deep.equal(1);
            expectContainText(testNode.childNodes[0].childNodes[0], "Child prop value");

            // Then it's gone again
            someItem(null);
            expect(testNode.childNodes[0].childNodes.length).to.deep.equal(0);
        });
    });
});
