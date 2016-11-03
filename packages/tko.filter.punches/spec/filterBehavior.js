

describe("Text filters preprocessor", function() {
    var filterPreprocessor = ko.punches.textFilter.preprocessor;

    it('Should convert basic input|filter syntax into function calls', function() {
        expect(filterPreprocessor('input|filter1|filter2:arg|filter3:arg1:arg2'))
            .toEqual("ko.filters['filter3'](ko.filters['filter2'](ko.filters['filter1'](input),arg),arg1,arg2)");
    });

    it('Should not be confused by | in quotes, or : or || in input', function() {
        expect(filterPreprocessor('input1||(input2?a:b)||"A|B"|filter'))
            .toEqual("ko.filters['filter'](input1||(input2?a:b)||\"A|B\")");
    });

    it('Should tolerate spaces or newlines in the input', function() {
        expect(filterPreprocessor('input \n| filter\n | filter2'))
            .toEqual("ko.filters['filter2'](ko.filters['filter'](input))");
    });

    it('Should be able to run filter output and apply filters to input', function() {
        try {
            ko.filters.test = function(input) { return input.toUpperCase(); };
            expect(eval(filterPreprocessor('"someText" | test'))).toEqual('SOMETEXT');
        } finally {
            delete ko.filters.test;
        }
    });

    it('Should pass arguments when applying filter', function() {
        try {
            ko.filters.test = function(input, length) { return input.slice(0, length);             };
            expect(eval(filterPreprocessor('"someText" | test:5'))).toEqual('someT');
        } finally {
            delete ko.filters.test;
        }
    });

    it('Should convert text to uppercase using uppercase filter', function() {
        expect(eval(filterPreprocessor('"someText" | uppercase'))).toEqual('SOMETEXT');
        // Should unwrap observable value
        expect(eval(filterPreprocessor('ko.observable("someText") | uppercase'))).toEqual('SOMETEXT');
    });

    it('Should convert text to lowercase using lowercase filter', function() {
        expect(eval(filterPreprocessor('"someText" | lowercase'))).toEqual('sometext');
        // Should unwrap observable value
        expect(eval(filterPreprocessor('ko.observable("someText") | lowercase'))).toEqual('sometext');
    });

    it('Should convert blank text, empty array, or null to default value using default filter', function() {
        // non-blank value is not converted
        expect(eval(filterPreprocessor('"someText" | default:"blank"'))).toEqual('someText');
        // empty string value is converted
        expect(eval(filterPreprocessor('"" | default:"blank"'))).toEqual('blank');
        // string value with only spaces is converted
        expect(eval(filterPreprocessor('"  " | default:"blank"'))).toEqual('blank');
        // spaces around string value are not trimmed
        expect(eval(filterPreprocessor('" x " | default:"blank"'))).toEqual(' x ');
        // zero value is not converted
        expect(eval(filterPreprocessor('0 | default:"blank"'))).toEqual(0);
        // empty array is converted
        expect(eval(filterPreprocessor('[] | default:"blank"'))).toEqual('blank');
        // null or undefined value is converted
        expect(eval(filterPreprocessor('null | default:"blank"'))).toEqual('blank');
        expect(eval(filterPreprocessor('undefined | default:"blank"'))).toEqual('blank');
        // a function is not converted
        var emptyFunction = function() {};
        expect(eval(filterPreprocessor('emptyFunction | default:"blank"'))).toEqual(emptyFunction);
        // Should unwrap observable value
        expect(eval(filterPreprocessor('ko.observable("someText") | default:"blank"'))).toEqual('someText');
    });

    it('Should replace found text in input using replace filter', function() {
        expect(eval(filterPreprocessor('"someText" | replace:"some":"any"'))).toEqual('anyText');
        // Should unwrap observable value
        expect(eval(filterPreprocessor('ko.observable("someText") | replace:"some":"any"'))).toEqual('anyText');
    });

    it('Should truncate text if appropriate using fit filter', function() {
        // Does nothing if input is shorter than length
        expect(eval(filterPreprocessor('"someText" | fit:8'))).toEqual('someText');
        // Truncates and add ellipses if input is longer than length
        expect(eval(filterPreprocessor('"someText" | fit:7'))).toEqual('some...');
        // Truncates and add custom text if specified
        expect(eval(filterPreprocessor('"someText" | fit:7:"!"'))).toEqual('someTe!');
        // Truncates from the left if specified
        expect(eval(filterPreprocessor('"someText" | fit:7::"left"'))).toEqual('...Text');
        // Truncates in the middle if specified
        expect(eval(filterPreprocessor('"someText" | fit:7::"middle"'))).toEqual('so...xt');
        // Should unwrap observable value
        expect(eval(filterPreprocessor('ko.observable("someText") | fit:8'))).toEqual('someText');
    });

    it('Should convert input to JSON text using json filter', function() {
        // Converts string
        expect(eval(filterPreprocessor('"someText" | json'))).toEqual('"someText"');
        // Converts array
        expect(eval(filterPreprocessor('[1,2,3] | json'))).toEqual('[1,2,3]');
        // Converts object
        expect(eval(filterPreprocessor('{a:true, b:false, c:null} | json'))).toEqual('{"a":true,"b":false,"c":null}');
        // Accepts space argument
        expect(eval(filterPreprocessor('{a:true, b:false, c:null} | json:" "'))).toEqual('{\n "a": true,\n "b": false,\n "c": null\n}');
    });
});

describe("Text filter bindings", function() {
    beforeEach(jasmine.prepareTestNode);
    beforeEach(function() { ko.punches.textFilter.enableForBinding('text'); });
    afterEach(function() { ko.bindingHandlers.text.preprocess = null; });

    it('Should convert input into appropriate output', function() {
        testNode.innerHTML = "<div data-bind='text: input | lowercase | fit:10 | json'></div>";
        ko.applyBindings({ input: "Some string of data" }, testNode);
        expect(testNode).toContainText('"some st..."');
    });
});