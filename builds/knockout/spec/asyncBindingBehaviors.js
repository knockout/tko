describe("Deferred bindings", function() {
    var clock,
        originalTaskScheduler,
        bindingSpy;

    beforeEach(function() {
        prepareTestNode();
        clock = sinon.useFakeTimers();
        originalTaskScheduler = ko.options.taskScheduler;
        ko.options.taskScheduler = function(callback) {
            setTimeout(callback, 0);
        };

        ko.options.deferUpdates = true;

        bindingSpy = sinon.stub();
        ko.bindingHandlers.test = {
            init: function (element, valueAccessor) { bindingSpy('init', ko.unwrap(valueAccessor())); },
            update: function (element, valueAccessor) { bindingSpy('update', ko.unwrap(valueAccessor())); }
        };
    });
    afterEach(function() {
        expect(ko.tasks.resetForTesting()).to.deep.equal(0);
        ko.options.taskScheduler = originalTaskScheduler;
        clock.restore();
        clock = null;
        ko.options.deferUpdates = false;
        bindingSpy = ko.bindingHandlers.test = null;
    });

    it("Should update bindings asynchronously", function() {
        var observable = ko.observable('A');

        // The initial "applyBindings" is synchronous
        testNode.innerHTML = "<div data-bind='test: myObservable'></div>";
        ko.applyBindings({ myObservable: observable }, testNode);
        expect(bindingSpy.getCalls().map(function(call) { return call.args; })).to.deep.equal([ ['init', 'A'], ['update', 'A'] ]);

        // When changing the observable, the update is deferred
        bindingSpy.resetHistory();
        observable('B');
        expect(bindingSpy.called).to.equal(false);

        // Update is still deferred
        observable('C');
        expect(bindingSpy.called).to.equal(false);

        clock.tick(1);
        // Only the latest value is notified
        expect(bindingSpy.getCalls().map(function(call) { return call.args; })).to.deep.equal([ ['update', 'C'] ]);
    });

    it("Should update templates asynchronously", function() {
        var observable = ko.observable('A');

        testNode.innerHTML = "<div data-bind='template: {data: myObservable}'><div data-bind='test: $data'></div></div>";
        ko.applyBindings({ myObservable: observable }, testNode);
        expect(bindingSpy.getCalls().map(function(call) { return call.args; })).to.deep.equal([ ['init', 'A'], ['update', 'A'] ]);

        // mutate; template should not be updated yet
        bindingSpy.resetHistory();
        observable('B');
        expect(bindingSpy.called).to.equal(false);

        // mutate again; template should not be updated yet
        observable('C');
        expect(bindingSpy.called).to.equal(false);

        clock.tick(1);
        // only the latest value should be used
        expect(bindingSpy.getCalls().map(function(call) { return call.args; })).to.deep.equal([ ['init', 'C'], ['update', 'C'] ]);
    });

    it("Should update 'foreach' items asynchronously", function() {
        var observable = ko.observableArray(["A"]);

        testNode.innerHTML = "<div data-bind='foreach: {data: myObservables}'><div data-bind='test: $data'></div></div>";
        ko.applyBindings({ myObservables: observable }, testNode);
        expect(bindingSpy.getCalls().map(function(call) { return call.args; })).to.deep.equal([ ['init', 'A'], ['update', 'A'] ]);

        // mutate; template should not be updated yet
        bindingSpy.resetHistory();
        observable(["A", "B"]);
        expect(bindingSpy.called).to.equal(false);

        // mutate again; template should not be updated yet
        observable(["A", "C"]);
        expect(bindingSpy.called).to.equal(false);

        clock.tick(1);
        // only the latest value should be used ("C" added but not "B")
        expect(bindingSpy.getCalls().map(function(call) { return call.args; })).to.deep.equal([ ['init', 'C'], ['update', 'C'] ]);

        // When an element is deleted and then added in a new place, it should register as a move and
        // not create new DOM elements or update any child bindings
        bindingSpy.resetHistory();
        observable.remove("A");
        observable.push("A");

        var nodeA = testNode.childNodes[0].childNodes[0],
            nodeB = testNode.childNodes[0].childNodes[1];
        clock.tick(1);
        expect(bindingSpy.called).to.equal(false);
        expect(testNode.childNodes[0].childNodes[0]).to.equal(nodeB);
        expect(testNode.childNodes[0].childNodes[1]).to.equal(nodeA);
    });

    it("Should be able to force an update using runEarly", function() {
        // This is based on the logic used in https://github.com/rniemeyer/knockout-sortable that when an item
        // is dragged and dropped in the same list, it must be deleted and re-added instead of being moved.

        testNode.innerHTML = "<div data-bind='foreach: someItems'><span data-bind='text: childProp'></span></div>";
        var someItems = ko.observableArray([
            { childProp: 'first child' },
            { childProp: 'second child' },
            { childProp: 'moving child' }
        ]);
        ko.applyBindings({ someItems: someItems }, testNode);
        expectContainHtml(testNode.childNodes[0], '<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span><span data-bind="text: childprop">moving child</span>');

        var sourceIndex = 2,
            targetIndex = 0,
            itemNode = testNode.childNodes[0].childNodes[sourceIndex],
            item = someItems()[sourceIndex];

        // Simply removing and re-adding item isn't sufficient because it will be registered as a move and no new element will be added
        // Using ko.tasks.runEarly between the updates ensures that the binding sees each individual update
        someItems.splice(sourceIndex, 1);
        ko.tasks.runEarly();
        someItems.splice(targetIndex, 0, item);

        clock.tick(1);
        expectContainHtml(testNode.childNodes[0], '<span data-bind="text: childprop">moving child</span><span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span>');
        expect(testNode.childNodes[0].childNodes[targetIndex]).not.to.equal(itemNode);    // node was created anew so it's not the same
    });

    it('Should get latest value when conditionally included', function() {
        // Test is based on example in https://github.com/knockout/knockout/issues/1975

        testNode.innerHTML = "<div data-bind=\"if: show\"><div data-bind=\"text: status\"></div></div>";
        var value = ko.observable(0),
            is1 = ko.pureComputed(function () {  return value() == 1; }),
            status = ko.pureComputed(function () { return is1() ? 'ok' : 'error'; }),
            show = ko.pureComputed(function () { return value() > 0 && is1(); });

        ko.applyBindings({ status: status, show: show }, testNode);
        expectContainHtml(testNode.childNodes[0], '');

        value(1);
        clock.tick(1);
        expectContainHtml(testNode.childNodes[0], '<div data-bind="text: status">ok</div>');

        value(0);
        clock.tick(1);
        expectContainHtml(testNode.childNodes[0], '');

        value(1);
        clock.tick(1);
        expectContainHtml(testNode.childNodes[0], '<div data-bind="text: status">ok</div>');
    });

    it('Should update "if" binding before descendant bindings', function() {
        // Based on example at https://github.com/knockout/knockout/pull/2226
        testNode.innerHTML = '<div data-bind="if: hasAddress()"><span data-bind="text: streetNumber().toLowerCase()"></span><span data-bind="text: street().toLowerCase()"></span></div>';
        var vm = {
            street: ko.observable(),
            streetNumber: ko.observable(),
            hasAddress: ko.pureComputed(function () { return vm.streetNumber() && vm.street(); })
        };

        ko.applyBindings(vm, testNode);
        clock.tick(1);
        expectContainText(testNode.childNodes[0], '');

        vm.street('my street');
        vm.streetNumber('123');
        clock.tick(1);
        expectContainText(testNode.childNodes[0], '123my street');

        vm.street(null);
        vm.streetNumber(null);
        clock.tick(1);
        expectContainText(testNode.childNodes[0], '');
    });

    it('Should update "with" binding before descendant bindings', function() {
        // Based on example at https://github.com/knockout/knockout/pull/2226
        testNode.innerHTML = '<div data-bind="with: hasAddress()"><span data-bind="text: $parent.streetNumber().toLowerCase()"></span><span data-bind="text: $parent.street().toLowerCase()"></span></div>';
        var vm = {
            street: ko.observable(),
            streetNumber: ko.observable(),
            hasAddress: ko.pureComputed(function () { return vm.streetNumber() && vm.street(); })
        };

        ko.applyBindings(vm, testNode);
        clock.tick(1);
        expectContainText(testNode.childNodes[0], '');

        vm.street('my street');
        vm.streetNumber('123');
        clock.tick(1);
        expectContainText(testNode.childNodes[0], '123my street');

        vm.street(null);
        vm.streetNumber(null);
        clock.tick(1);
        expectContainText(testNode.childNodes[0], '');
    });

    it('Should leave descendant nodes unchanged if the value is truthy and remains truthy when changed', function() {
        var someItem = ko.observable(true);
        testNode.innerHTML = "<div data-bind='if: someItem'><span data-bind='text: (++counter)'></span></div>";
        var originalNode = testNode.childNodes[0].childNodes[0];

        // Value is initially true, so nodes are retained
        ko.applyBindings({ someItem: someItem, counter: 0 }, testNode);
        expect(testNode.childNodes[0].childNodes[0].tagName.toLowerCase()).to.deep.equal("span");
        expect(testNode.childNodes[0].childNodes[0]).to.deep.equal(originalNode);
        expectContainText(testNode, "1");

        // Change the value to a different truthy value; see the previous SPAN remains
        someItem('different truthy value');
        clock.tick(1);
        expect(testNode.childNodes[0].childNodes[0].tagName.toLowerCase()).to.deep.equal("span");
        expect(testNode.childNodes[0].childNodes[0]).to.deep.equal(originalNode);
        expectContainText(testNode, "1");
    });

});
