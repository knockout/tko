
describe('Mapping helpers', function() {
    it('ko.toJS should require a parameter', function() {
        expect(function () {
            ko.toJS();
        }).to.throw();
    });

    it('ko.toJS should unwrap observable values', function() {
        var atomicValues = ["hello", 123, true, null, undefined, { a : 1 }];
        for (var i = 0; i < atomicValues.length; i++) {
            var data = ko.observable(atomicValues[i]);
            var result = ko.toJS(data);
            expect(ko.isObservable(result)).to.deep.equal(false);
            expect(result).to.deep.equal(atomicValues[i]);
        }
    });

    it('ko.toJS should recursively unwrap observables whose values are themselves observable', function() {
        var weirdlyNestedObservable = ko.observable(
            ko.observable(
                ko.observable(
                    ko.observable('Hello')
                )
            )
        );
        var result = ko.toJS(weirdlyNestedObservable);
        expect(result).to.deep.equal('Hello');
    });

    it('ko.toJS should unwrap observable properties, including nested ones', function() {
        var data = {
            a : ko.observable(123),
            b : {
                b1 : ko.observable(456),
                b2 : [789, ko.observable('X')]
            }
        };
        var result = ko.toJS(data);
        expect(result.a).to.deep.equal(123);
        expect(result.b.b1).to.deep.equal(456);
        expect(result.b.b2[0]).to.deep.equal(789);
        expect(result.b.b2[1]).to.deep.equal('X');
    });

    it('ko.toJS should unwrap observable arrays and things inside them', function() {
        var data = ko.observableArray(['a', 1, { someProp : ko.observable('Hey') }]);
        var result = ko.toJS(data);
        expect(result.length).to.deep.equal(3);
        expect(result[0]).to.deep.equal('a');
        expect(result[1]).to.deep.equal(1);
        expect(result[2].someProp).to.deep.equal('Hey');
    });

    it('ko.toJS should resolve reference cycles', function() {
        var obj = {};
        obj.someProp = { owner : ko.observable(obj) };
        var result = ko.toJS(obj);
        expect(result.someProp.owner).to.deep.equal(result);
    });

    it('ko.toJS should treat RegExp, Date, Number, String and Boolean instances as primitives (and not walk their subproperties)', function () {
        var regExp = new RegExp();
        var date = new Date();
        var string = new String();
        var number = new Number();
        var booleanValue = new Boolean(); // 'boolean' is a resever word in JavaScript

        var result = ko.toJS({
            regExp: ko.observable(regExp),
            due: ko.observable(date),
            string: ko.observable(string),
            number: ko.observable(number),
            booleanValue: ko.observable(booleanValue)
        });

        expect(result.regExp instanceof RegExp).to.deep.equal(true);
        expect(result.regExp).to.deep.equal(regExp);

        expect(result.due instanceof Date).to.deep.equal(true);
        expect(result.due).to.deep.equal(date);

        expect(result.string instanceof String).to.deep.equal(true);
        expect(result.string).to.deep.equal(string);

        expect(result.number instanceof Number).to.deep.equal(true);
        expect(result.number).to.deep.equal(number);

        expect(result.booleanValue instanceof Boolean).to.deep.equal(true);
        expect(result.booleanValue).to.deep.equal(booleanValue);
    });

    it('ko.toJS should serialize functions', function() {
        var obj = {
            include: ko.observable("test"),
            exclude: function(){}
        };

        var result = ko.toJS(obj);
        expect(result.include).to.deep.equal("test");
        expect(result.exclude).to.deep.equal(obj.exclude);
    });

    it('ko.toJSON should unwrap everything and then stringify', function() {
        var data = ko.observableArray(['a', 1, { someProp : ko.observable('Hey') }]);
        var result = ko.toJSON(data);

        // Check via parsing so the specs are independent of browser-specific JSON string formatting
        expect(typeof result).to.deep.equal('string');
        var parsedResult = ko.utils.parseJson(result);
        expect(parsedResult.length).to.deep.equal(3);
        expect(parsedResult[0]).to.deep.equal('a');
        expect(parsedResult[1]).to.deep.equal(1);
        expect(parsedResult[2].someProp).to.deep.equal('Hey');
    });

    it('ko.toJSON should respect .toJSON functions on objects', function() {
        var data = {
            a: { one: "one", two: "two"},
            b: ko.observable({ one: "one", two: "two" })
        };
        data.a.toJSON = function() { return "a-mapped" };
        data.b().toJSON = function() { return "b-mapped" };
        var result = ko.toJSON(data);

        // Check via parsing so the specs are independent of browser-specific JSON string formatting
        expect(typeof result).to.deep.equal("string");
        var parsedResult = ko.utils.parseJson(result);
        expect(parsedResult).to.deep.equal({ a: "a-mapped", b: "b-mapped" });
    });

    it('ko.toJSON should respect .toJSON functions on arrays', function() {
        var data = {
            a: [1, 2],
            b: ko.observableArray([3, 4])
        };
        data.a.toJSON = function() { return "a-mapped" };
        data.b().toJSON = function() { return "b-mapped" };
        var result = ko.toJSON(data);

        // Check via parsing so the specs are independent of browser-specific JSON string formatting
        expect(typeof result).to.deep.equal('string');
        var parsedResult = ko.utils.parseJson(result);
        expect(parsedResult).to.deep.equal({ a: "a-mapped", b: "b-mapped" });
    });

    it('ko.toJSON should respect replacer/space options', function() {
        var data = { a: 1 };

        // Without any options
        expect(ko.toJSON(data)).to.deep.equal("{\"a\":1}");

        // With a replacer
        function myReplacer(x, obj) {
            expect(obj).to.deep.equal(data);
            return "my replacement";
        };
        expect(ko.toJSON(data, myReplacer)).to.deep.equal("\"my replacement\"");

        // With spacer
        expect(ko.toJSON(data, undefined, "    ")).to.be.oneOf([
            "{\n    \"a\":1\n}",  // Firefox 3.6, for some reason, omits the space after the colon. Doesn't really matter to us.
            "{\n    \"a\": 1\n}"  // All other browsers produce this format
        ]);
    });
})
