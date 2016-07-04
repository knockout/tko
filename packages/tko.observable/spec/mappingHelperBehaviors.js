//
// Test Mapping Behaviour
//

import {
    toJS, toJSON, isObservable, observable, observableArray
} from '../index.js';

describe('Mapping helpers', function() {
    it('toJS should require a parameter', function() {
        expect(function () {
            toJS();
        }).toThrow();
    });

    it('toJS should unwrap observable values', function() {
        var atomicValues = ["hello", 123, true, null, undefined, { a : 1 }];
        for (var i = 0; i < atomicValues.length; i++) {
            var data = observable(atomicValues[i]);
            var result = toJS(data);
            expect(isObservable(result)).toEqual(false);
            expect(result).toEqual(atomicValues[i]);
        }
    });

    it('toJS should recursively unwrap observables whose values are themselves observable', function() {
        var weirdlyNestedObservable = observable(
            observable(
                observable(
                    observable('Hello')
                )
            )
        );
        var result = toJS(weirdlyNestedObservable);
        expect(result).toEqual('Hello');
    });

    it('toJS should unwrap observable properties, including nested ones', function() {
        var data = {
            a : observable(123),
            b : {
                b1 : observable(456),
                b2 : [789, observable('X')]
            }
        };
        var result = toJS(data);
        expect(result.a).toEqual(123);
        expect(result.b.b1).toEqual(456);
        expect(result.b.b2[0]).toEqual(789);
        expect(result.b.b2[1]).toEqual('X');
    });

    it('toJS should unwrap observable arrays and things inside them', function() {
        var data = observableArray(['a', 1, { someProp : observable('Hey') }]);
        var result = toJS(data);
        expect(result.length).toEqual(3);
        expect(result[0]).toEqual('a');
        expect(result[1]).toEqual(1);
        expect(result[2].someProp).toEqual('Hey');
    });

    it('toJS should resolve reference cycles', function() {
        var obj = {};
        obj.someProp = { owner : observable(obj) };
        var result = toJS(obj);
        expect(result.someProp.owner).toEqual(result);
    });

    it('toJS should treat RegExp, Date, Number, String and Boolean instances as primitives (and not walk their subproperties)', function () {
        var regExp = new RegExp();
        var date = new Date();
        var string = new String();
        var number = new Number();
        var booleanValue = new Boolean(); // 'boolean' is a resever word in Javascript

        var result = toJS({
            regExp: observable(regExp),
            due: observable(date),
            string: observable(string),
            number: observable(number),
            booleanValue: observable(booleanValue)
        });

        expect(result.regExp instanceof RegExp).toEqual(true);
        expect(result.regExp).toEqual(regExp);

        expect(result.due instanceof Date).toEqual(true);
        expect(result.due).toEqual(date);

        expect(result.string instanceof String).toEqual(true);
        expect(result.string).toEqual(string);

        expect(result.number instanceof Number).toEqual(true);
        expect(result.number).toEqual(number);

        expect(result.booleanValue instanceof Boolean).toEqual(true);
        expect(result.booleanValue).toEqual(booleanValue);
    });

    it('toJS should serialize functions', function() {
        var obj = {
            include: observable("test"),
            exclude: function(){}
        };

        var result = toJS(obj);
        expect(result.include).toEqual("test");
        expect(result.exclude).toEqual(obj.exclude);
    });

    it('toJSON should unwrap everything and then stringify', function() {
        var data = observableArray(['a', 1, { someProp : observable('Hey') }]);
        var result = toJSON(data);

        // Check via parsing so the specs are independent of browser-specific JSON string formatting
        expect(typeof result).toEqual('string');
        var parsedResult = JSON.parse(result);
        expect(parsedResult.length).toEqual(3);
        expect(parsedResult[0]).toEqual('a');
        expect(parsedResult[1]).toEqual(1);
        expect(parsedResult[2].someProp).toEqual('Hey');
    });

    it('toJSON should respect .toJSON functions on objects', function() {
        var data = {
            a: { one: "one", two: "two"},
            b: observable({ one: "one", two: "two" })
        };
        data.a.toJSON = function() { return "a-mapped"; };
        data.b().toJSON = function() { return "b-mapped"; };
        var result = toJSON(data);

        // Check via parsing so the specs are independent of browser-specific JSON string formatting
        expect(typeof result).toEqual("string");
        var parsedResult = JSON.parse(result);
        expect(parsedResult).toEqual({ a: "a-mapped", b: "b-mapped" });
    });

    it('toJSON should respect .toJSON functions on arrays', function() {
        var data = {
            a: [1, 2],
            b: observableArray([3, 4])
        };
        data.a.toJSON = function() { return "a-mapped"; };
        data.b().toJSON = function() { return "b-mapped"; };
        var result = toJSON(data);

        // Check via parsing so the specs are independent of browser-specific JSON string formatting
        expect(typeof result).toEqual('string');
        var parsedResult = JSON.parse(result);
        expect(parsedResult).toEqual({ a: "a-mapped", b: "b-mapped" });
    });

    it('toJSON should respect replacer/space options', function() {
        var data = { a: 1 };

        // Without any options
        expect(toJSON(data)).toEqual("{\"a\":1}");

        // With a replacer
        function myReplacer(x, obj) {
            expect(obj).toEqual(data);
            return "my replacement";
        }
        expect(toJSON(data, myReplacer)).toEqual("\"my replacement\"");

        // With spacer
        expect(toJSON(data, undefined, "    ")).toEqual("{\n    \"a\": 1\n}");
    });
});
