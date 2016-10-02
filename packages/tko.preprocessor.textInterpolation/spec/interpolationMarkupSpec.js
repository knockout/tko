/* eslint semi: 0 */

import {
    options
} from 'tko.utils';

import {
    applyBindings
} from 'tko.bind';

import {
    observable as Observable
} from 'tko.observable';

import {
    Provider
} from 'tko.provider';

import {
    bindings as coreBindings
} from 'tko.binding.core';

import {
    bindings as templateBindings
} from 'tko.binding.template';


import {
    preprocessors
} from '../index.js';


import 'tko.utils/helpers/jasmine-13-helper.js';

var interpolationMarkup = preprocessors[0]


describe("Interpolation Markup preprocessor", function() {
    beforeEach(function () {
        var provider = new Provider();
        provider.bindingHandlers.set(coreBindings);
    })

    it('Should do nothing when there are no expressions', function() {
        var result = interpolationMarkup.preprocessor(document.createTextNode("some text"));
        expect(result).toBeUndefined();
    });

    it('Should do nothing when empty', function() {
        var result = interpolationMarkup.preprocessor(document.createTextNode(""));
        expect(result).toBeUndefined();
    });

    it('Should not parse unclosed binding', function() {
        var result = interpolationMarkup.preprocessor(document.createTextNode("some {{ text"));
        expect(result).toBeUndefined();
    });

    it('Should not parse unopened binding', function() {
        var result = interpolationMarkup.preprocessor(document.createTextNode("some }} text"));
        expect(result).toBeUndefined();
    });

    it('Should create binding from {{...}} expression', function() {
        var result = interpolationMarkup.preprocessor(document.createTextNode("some {{ expr }} text"));
        expect(result).toHaveNodeTypes([3, 8, 8, 3]);   // text, comment, comment, text
        expect(result[1].nodeValue).toEqual('ko text:expr');
        expect(result[2].nodeValue).toEqual('/ko');
    });

    it('Should ignore unmatched delimiters', function() {
        var result = interpolationMarkup.preprocessor(document.createTextNode("some {{ expr }} }} text"));
        expect(result).toHaveNodeTypes([3, 8, 8, 3]);   // text, comment, comment, text
        expect(result[1].nodeValue).toEqual('ko text:expr }}');
    });

    it('Should support two expressions', function() {
        var result = interpolationMarkup.preprocessor(document.createTextNode("some {{ expr1 }} middle {{ expr2 }} text"));
        expect(result).toHaveNodeTypes([3, 8, 8, 3, 8, 8, 3]);   // text, comment, comment, text, comment, comment, text
        expect(result[1].nodeValue).toEqual('ko text:expr1');
        expect(result[4].nodeValue).toEqual('ko text:expr2');
    });

    it('Should skip empty text', function() {
        var result = interpolationMarkup.preprocessor(document.createTextNode("{{ expr1 }}{{ expr2 }}"));
        expect(result).toHaveNodeTypes([8, 8, 8, 8]);   // comment, comment, comment, comment
        expect(result[0].nodeValue).toEqual('ko text:expr1');
        expect(result[2].nodeValue).toEqual('ko text:expr2');
    });

    it('Should support more than two expressions', function() {
        var result = interpolationMarkup.preprocessor(document.createTextNode("x {{ expr1 }} y {{ expr2 }} z {{ expr3 }}"));
        expect(result).toHaveNodeTypes([3, 8, 8, 3, 8, 8, 3, 8, 8]);   // text, comment, comment, text, comment, comment, text, comment, comment
        expect(result[1].nodeValue).toEqual('ko text:expr1');
        expect(result[4].nodeValue).toEqual('ko text:expr2');
        expect(result[7].nodeValue).toEqual('ko text:expr3');
    });

    describe("Using unescaped HTML syntax", function() {
        it('Should not parse unclosed binding', function() {
            var result = interpolationMarkup.preprocessor(document.createTextNode("some {{{ text"));
            expect(result).toBeUndefined();
        });

        it('Should not parse unopened binding', function() {
            var result = interpolationMarkup.preprocessor(document.createTextNode("some }}} text"));
            expect(result).toBeUndefined();
        });

        it('Should create binding from {{{...}}} expression', function() {
            var result = interpolationMarkup.preprocessor(document.createTextNode("some {{{ expr }}} text"));
            expect(result).toHaveNodeTypes([3, 8, 8, 3]);   // text, comment, comment, text
            expect(result[1].nodeValue).toEqual('ko html:expr');
            expect(result[2].nodeValue).toEqual('/ko');
        });

        it('Should ignore unmatched delimiters', function() {
            var result = interpolationMarkup.preprocessor(document.createTextNode("some {{{ expr }}} }}} text"));
            expect(result).toHaveNodeTypes([3, 8, 8, 3]);   // text, comment, comment, text
            expect(result[1].nodeValue).toEqual('ko html:expr }}}');
        });

        it('Should support two expressions', function() {
            var result = interpolationMarkup.preprocessor(document.createTextNode("some {{{ expr1 }}} middle {{{ expr2 }}} text"));
            expect(result).toHaveNodeTypes([3, 8, 8, 3, 8, 8, 3]);   // text, comment, comment, text, comment, comment, text
            expect(result[1].nodeValue).toEqual('ko html:expr1');
            expect(result[4].nodeValue).toEqual('ko html:expr2');
        });
    });

    describe("Using block syntax", function() {
        it('Should create binding from {{#....}}{{/....}} expression', function() {
            var result = interpolationMarkup.preprocessor(document.createTextNode("some {{#binding:value}}{{/binding}} text"));
            expect(result).toHaveNodeTypes([3, 8, 8, 3]);   // text, comment, comment, text
            expect(result[1].nodeValue).toEqual('ko binding:value');
            expect(result[2].nodeValue).toEqual('/ko');
        });

        it('Should tolerate spaces around expressions from {{ #.... }}{{ /.... }} expression', function() {
            var result = interpolationMarkup.preprocessor(document.createTextNode("some {{ #binding:value }}{{ /binding }} text"));
            expect(result).toHaveNodeTypes([3, 8, 8, 3]);   // text, comment, comment, text
            expect(result[1].nodeValue).toEqual('ko binding:value');
            expect(result[2].nodeValue).toEqual('/ko');
        });

        it('Should tolerate spaces around various components', function() {
            var result = interpolationMarkup.preprocessor(document.createTextNode("some {{# binding : value }}{{/ binding }} text"));
            expect(result).toHaveNodeTypes([3, 8, 8, 3]);   // text, comment, comment, text
            expect(result[1].nodeValue).toEqual('ko  binding : value');
            expect(result[2].nodeValue).toEqual('/ko');
        });

        it('Should insert semicolon if missing', function() {
            var result = interpolationMarkup.preprocessor(document.createTextNode("some {{#binding value}}{{/binding}} text"));
            expect(result).toHaveNodeTypes([3, 8, 8, 3]);   // text, comment, comment, text
            expect(result[1].nodeValue).toEqual('ko binding:value');
        });

        it('Should not insert semicolon if binding has no value', function() {
            var result = interpolationMarkup.preprocessor(document.createTextNode("some {{#binding}}{{/binding}} text"));
            expect(result).toHaveNodeTypes([3, 8, 8, 3]);   // text, comment, comment, text
            expect(result[1].nodeValue).toEqual('ko binding');
        });

        it('Should support self-closing syntax', function() {
            var result = interpolationMarkup.preprocessor(document.createTextNode("some {{#binding:value/}} text"));
            expect(result).toHaveNodeTypes([3, 8, 8, 3]);   // text, comment, comment, text
            expect(result[1].nodeValue).toEqual('ko binding:value');
            expect(result[2].nodeValue).toEqual('/ko');
        });

        it("Should tolerate space around self-closing syntax", function () {
            var result = interpolationMarkup.preprocessor(document.createTextNode("some {{ # binding:value / }} text"));
            expect(result).toHaveNodeTypes([3, 8, 8, 3]);   // text, comment, comment, text
            expect(result[1].nodeValue).toEqual('ko  binding:value ');
            expect(result[2].nodeValue).toEqual('/ko');
        })
    });
});

describe("Interpolation Markup bindings", function() {
    var bindingHandlers;

    beforeEach(jasmine.prepareTestNode);

    beforeEach(function(){
        var provider = new Provider();
        provider.addPreprocessor(interpolationMarkup.preprocessor);
        options.bindingProviderInstance = provider;
        bindingHandlers = provider.bindingHandlers;
        bindingHandlers.set(coreBindings);
        bindingHandlers.set(templateBindings);
    });

    it('Should replace {{...}} expression with virtual text binding', function() {
        jasmine.setNodeText(testNode, "hello {{'name'}}!");
        applyBindings(null, testNode);
        expect(testNode).toContainText("hello name!");
        expect(testNode).toContainHtml("hello <!--ko text:'name'-->name<!--/ko-->!");
    });

    it('Should replace multiple expressions', function() {
        jasmine.setNodeText(testNode, "hello {{'name'}}{{'!'}}");
        applyBindings(null, testNode);
        expect(testNode).toContainText("hello name!");
    });

    it('Should support any content of expression, including functions and {{}}', function() {
        jasmine.setNodeText(testNode, "hello {{ (function(){return '{{name}}'}()) }}!");
        applyBindings(null, testNode);
        expect(testNode).toContainText("hello {{name}}!");
    });

    it('Should ignore unmatched }} and {{', function() {
        jasmine.setNodeText(testNode, "hello }}'name'{{'!'}}{{");
        applyBindings(null, testNode);
        expect(testNode).toContainText("hello }}'name'!{{");
    });

    it('Should update when observable changes', function() {
        jasmine.setNodeText(testNode, "The best {{what}}.");
        var observable = Observable('time');
        applyBindings({what: observable}, testNode);
        expect(testNode).toContainText("The best time.");
        observable('fun');
        expect(testNode).toContainText("The best fun.");
    });

    it('Should be able to override wrapExpression to define a different set of elements', function() {
        var originalWrapExpresssion = interpolationMarkup.wrapExpression;
        this.after(function() {
            interpolationMarkup.wrapExpression = originalWrapExpresssion;
        });

        interpolationMarkup.wrapExpression = function(expressionText, node) {
            return originalWrapExpresssion('"--" + ' + expressionText + ' + "--"', node);
        }

        jasmine.setNodeText(testNode, "hello {{'name'}}!");
        applyBindings(null, testNode);
        expect(testNode).toContainText("hello --name--!");
    });

    it('Should not modify the content of <textarea> tags', function() {
        testNode.innerHTML = "<p>Hello</p><textarea>{{'name'}}</textarea><p>Goodbye</p>";
        applyBindings(null, testNode);
        expect(testNode).toContainHtml("<p>hello</p><textarea>{{'name'}}</textarea><p>goodbye</p>");
    });

    it('Should not modify the content of <script> tags', function() {
        testNode.innerHTML = "<p>Hello</p><script>{{return}}</script><p>Goodbye</p>";
        applyBindings(null, testNode);
        expect(testNode).toContainHtml("<p>hello</p><script>{{return}}</script><p>goodbye</p>");
    });

    it('Should work when used in template declared using <script>', function() {
        testNode.innerHTML = "<div data-bind='template: \"tmpl\"'></div><script type='text/html' id='tmpl'>{{'name'}}</textarea>";
        applyBindings(null, testNode);
        expect(testNode.childNodes[0]).toContainText("name");
    });

    it('Should work when used in template declared using <textarea>', function() {
        testNode.innerHTML = "<div data-bind='template: \"tmpl\"'></div><textarea id='tmpl'>{{'name'}}</textarea>";
        applyBindings(null, testNode);
        expect(testNode.childNodes[0]).toContainText("name");
    });

    describe("Using unescaped HTML syntax", function() {
        it('Should replace {{{...}}} expression with virtual html binding', function() {
            jasmine.setNodeText(testNode, "hello {{{'<b>name</b>'}}}!");
            applyBindings(null, testNode);
            expect(testNode).toContainText("hello name!");
            expect(testNode).toContainHtml("hello <!--ko html:'<b>name</b>'--><b>name</b><!--/ko-->!");
            expect(testNode.childNodes[2].nodeName.toLowerCase()).toEqual('b');
        });

        it('Should support mix of escaped and unescape expressions', function() {
            jasmine.setNodeText(testNode, "hello {{{'<b>name</b>'}}}{{'!'}}");
            applyBindings(null, testNode);
            expect(testNode).toContainText("hello name!");
            expect(testNode).toContainHtml("hello <!--ko html:'<b>name</b>'--><b>name</b><!--/ko--><!--ko text:'!'-->!<!--/ko-->");
            expect(testNode.childNodes[2].nodeName.toLowerCase()).toEqual('b');
        });

        it('Should support any content of expression, including functions and {{{}}}', function() {
            jasmine.setNodeText(testNode, "hello {{{ (function(){return '<b>{{{name}}}</b>'}()) }}}!");
            applyBindings(null, testNode);
            expect(testNode).toContainText("hello {{{name}}}!");
            expect(testNode.childNodes[2].nodeName.toLowerCase()).toEqual('b');
        });

        it('Should ignore unmatched }}} and {{{', function() {
            jasmine.setNodeText(testNode, "hello }}}'name'{{{'!'}}}{{{");
            applyBindings(null, testNode);
            expect(testNode).toContainText("hello }}}'name'!{{{");
        });

        it('Should update when observable changes', function() {
            jasmine.setNodeText(testNode, "The best {{{what}}}.");
            var observable = Observable('<b>time</b>');
            applyBindings({what: observable}, testNode);
            expect(testNode).toContainText("The best time.");
            expect(testNode.childNodes[2].nodeName.toLowerCase()).toEqual('b');
            observable('<i>fun</i>');
            expect(testNode).toContainText("The best fun.");
            expect(testNode.childNodes[2].nodeName.toLowerCase()).toEqual('i');
        });
    });

    describe("Using block syntax", function() {
        it('Should support "with"', function() {
            testNode.innerHTML = "<div><h1>{{title}}</h1>{{#with: story}}<div>{{{intro}}}</div><div>{{{body}}}</div>{{/with}}</div>";
            applyBindings({
                title: "First Post",
                story: {
                    intro: "Before the jump",
                    body: "After the jump"
                }
            }, testNode);
            expect(testNode).toContainHtmlElementsAndText("<div><h1>first post</h1><div>before the jump</div><div>after the jump</div></div>");
        });

        it('Should support "foreach"', function() {
            testNode.innerHTML = "<ul>{{#foreach: people}}<li>{{$data}}</li>{{/foreach}}</ul>";
            applyBindings({
                people: [ "Bill Gates", "Steve Jobs", "Larry Ellison" ]
            }, testNode);
            expect(testNode).toContainHtmlElementsAndText("<ul><li>bill gates</li><li>steve jobs</li><li>larry ellison</li></ul>");
        });

        it('Should support nested blocks', function() {
            testNode.innerHTML = "<ul>{{#foreach: people}} {{#if: $data}}<li>{{$data}}</li>{{/if}}{{/foreach}}</ul>";
            applyBindings({
                people: [ "Bill Gates", null, "Steve Jobs", "Larry Ellison" ]
            }, testNode);
            expect(testNode).toContainHtmlElementsAndText("<ul><li>bill gates</li><li>steve jobs</li><li>larry ellison</li></ul>");
        });

        it('Should work without the colon', function() {
            testNode.innerHTML = "<ul>{{#foreach people}}<li>{{$data}}</li>{{/foreach}}</ul>";
            applyBindings({
                people: [ "Bill Gates", "Steve Jobs", "Larry Ellison" ]
            }, testNode);
            expect(testNode).toContainHtmlElementsAndText("<ul><li>bill gates</li><li>steve jobs</li><li>larry ellison</li></ul>");
        });

        it('Should support self-closing blocks', function() {
            jasmine.setNodeText(testNode, "hello {{#text 'name'/}}");
            applyBindings(null, testNode);
            expect(testNode).toContainText("hello name");
        });
    });
});
