

import {
  observable
} from 'tko.observable'

import { filters } from '../src'

if (!Array.isArray) {
  Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}


describe("Text filters preprocessor", function() {
    // var filterPreprocessor = ko.punches.textFilter.preprocessor;

    /* Skipping the following five since they are tests that apply to the
       filter-runner moreso than any specific filter exported here. */
    xit('Should convert basic input|filter syntax into function calls', function() {
        expect(filterPreprocessor('input|filter1|filter2:arg|filter3:arg1:arg2'))
            .toEqual("ko.filters['filter3'](ko.filters['filter2'](ko.filters['filter1'](input),arg),arg1,arg2)");
    });

    xit('Should not be confused by | in quotes, or : or || in input', function() {
        expect(filterPreprocessor('input1||(input2?a:b)||"A|B"|filter'))
            .toEqual("ko.filters['filter'](input1||(input2?a:b)||\"A|B\")");
    });

    xit('Should tolerate spaces or newlines in the input', function() {
        expect(filterPreprocessor('input \n| filter\n | filter2'))
            .toEqual("ko.filters['filter2'](ko.filters['filter'](input))");
    });

    xit('Should be able to run filter output and apply filters to input', function() {
        try {
            ko.filters.test = function(input) { return input.toUpperCase(); };
            expect(eval(filterPreprocessor('"someText" | test'))).toEqual('SOMETEXT');
        } finally {
            delete ko.filters.test;
        }
    });

    xit('Should pass arguments when applying filter', function() {
        try {
            ko.filters.test = function(input, length) { return input.slice(0, length);             };
            expect(eval(filterPreprocessor('"someText" | test:5'))).toEqual('someT');
        } finally {
            delete ko.filters.test;
        }
    });
    
    /* ~~~ Filters ~~~ */
    
    function attempt(filter, args, expected) {
      expect(
        filters[filter].apply(null, Array.isArray(args) ? args : [args])
      ).toEqual(expected)
    }

    it('Should convert text to uppercase using uppercase filter', function() {
        attempt('uppercase', 'someText', 'SOMETEXT')
        attempt('uppercase', observable('someText'), 'SOMETEXT')
    });

    it('Should convert text to lowercase using lowercase filter', function() {
      attempt('lowercase', 'someText', 'sometext')
      attempt('lowercase', observable('someText'), 'sometext')
    });

    it('Should convert blank text, empty array, or null to default value using default filter', function() {
        // non-blank value is not converted
        attempt('default', ['someText', 'blank'], 'someText')
        // empty string value is converted
        attempt('default', ['', 'blank'], 'blank')
        // string value with only spaces is converted
        attempt('default', ['   ', 'blank'], 'blank')
        // spaces around string value are not trimmed
        attempt('default', ['  x  ', 'blank'], '  x  ')
        // zero value is not converted
        attempt('default', [0, "blank"], 0);
        // empty array is converted
        attempt('default', [[], "blank"], 'blank');
        // null or undefined value is converted
        attempt('default', [null, "blank"], 'blank');
        attempt('default', [undefined, "blank"], 'blank');
        // a function is not converted
        var emptyFunction = function() {};
        attempt('default', [emptyFunction, "blank"], emptyFunction);
        // Should unwrap observable value
        attempt('default', [observable("someText"), "blank"], 'someText');
    });

    it('Should replace found text in input using replace filter', function() {
        attempt('replace', ["someText", 'some', 'any'], 'anyText') 
        // Should unwrap observable value
        attempt('replace', [observable("someText"), 'some', 'any'], 'anyText')
    });

    it('Should truncate text if appropriate using fit filter', function() {
        // Does nothing if input is shorter than length
        attempt('fit', ["someText", 8], 'someText');
        // Truncates and add ellipses if input is longer than length
        attempt('fit', ["someText", 7], 'some...');
        // Truncates and add custom text if specified
        attempt('fit', ["someText", 7, "!"], 'someTe!')
        // Truncates from the left if specified
        attempt('fit', ["someText", 7, undefined, "left"], '...Text')
        // Truncates in the middle if specified
        attempt('fit', ["someText", 7, undefined, "middle"], 'so...xt')
        // Should unwrap observable value
        attempt('fit', [observable("someText"), 8], 'someText');
    });

    it('Should convert input to JSON text using json filter', function() {
        // Converts string
        attempt('json', "someText", '"someText"');
        // Converts array
        attempt('json', [[1,2,3]], '[1,2,3]');
        // Converts object
        attempt('json', {a:true, b:false, c:null}, '{"a":true,"b":false,"c":null}');
        // Accepts space argument
        attempt('json', [{a:true, b:false, c:null}, 1], '{\n "a": true,\n "b": false,\n "c": null\n}');
    });
});

/* Skip this since */
xdescribe("Text filter bindings", function() {
    beforeEach(jasmine.prepareTestNode);

    it('Should convert input into appropriate output', function() {
        testNode.innerHTML = "<div data-bind='text: input | lowercase | fit:10 | json'></div>";
        ko.applyBindings({ input: "Some string of data" }, testNode);
        expect(testNode).toContainText('"some st..."');
    });
});