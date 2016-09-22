
import {
    arrayForEach, parseHtmlFragment
} from '../index';

import '../helpers/jasmine-13-helper.js';

describe('Parse HTML fragment', function() {
    var supportsTemplateTag = 'content' in document.createElement('template');

    beforeEach(jasmine.prepareTestNode);

    // See: https://github.com/knockout/knockout/issues/1880
    arrayForEach([
        { html: '<tr-component></tr-component>',
          parsed: ['<tr-component></tr-component>'],
          OldjQueryFails: true },
        { html: '<thead><tr><th><thcomponent>hello</thcomponent></th></tr></thead>', parsed: ['<thead><tr><th><thcomponent>hello</thcomponent></th></tr></thead>'] },
        { html: '<tbody-component>world</tbody-component>',
          parsed: ['<tbody-component>world</tbody-component>'],
          OldjQueryFails: true },
        { html: '<tfoot-component>foo</tfoot-component>', parsed: ['<tfoot-component>foo</tfoot-component>'],
          OldjQueryFails: true },
        { html: '<div></div>', parsed: ['<div></div>'] },
        { html: '<custom-component></custom-component>', parsed: ['<custom-component></custom-component>'] },
        { html: '<tr></tr>', parsed: ['<tr></tr>'] },
        { html: '<tr></tr><tr></tr>', parsed: ['<tr></tr>', '<tr></tr>'] },
        { html: '<td></td>', parsed: ['<td></td>'] },
        { html: '<th></th>', parsed: ['<th></th>'] },
        { html: '<tbody></tbody>', parsed: ['<tbody></tbody>'] },
        { html: '<table><tbody></tbody></table>', parsed: ['<table><tbody></tbody></table>'] },
        { html: '<div></div><div></div>', parsed: ['<div></div>', '<div></div>'] },
        { html: '<optgroup label=x><option>text</option></optgroup>', parsed: ['<optgroup label=x><option>text</option></optgroup>'] },
        { html: '<option>text</option>', parsed: [ '<option>text</option>' ] },
        { html: '<colgroup><col></colgroup>', parsed: ['<colgroup><col></colgroup>'] },
        { html: '<col data-param="p">', parsed: ['<col data-param="p">'] },
        { html: '<param name=x>', parsed: ['<param name=x>'] },
        { html: '<area>', parsed: ['<area>'] },
        { html: '<legend>lgt</legend>', parsed: ['<legend>lgt</legend>'] },
        { html: '<!-- z --><div>ct</div><!-- zz -->', parsed: ['<!-- z -->', '<div>ct</div>', '<!-- zz -->'] },
        // The following fails with the simple HTML parser
        { html: '<!-- v --><thead></thead><!-- vv -->', parsed: ['<!-- v -->', '<thead></thead>', '<!-- vv -->'], simpleParserFails: true }
    ], function (data) {
        it('should parse ' + data.html + ' correctly', function () {
            // Early out if Simple HTML parser is known to fail for this data.
            if (!supportsTemplateTag) {
                if (!jQueryInstance && data.simpleParserFails) { return; }
                if (jQueryInstance && jQueryInstance.fn.jquery[0] < 3
                    && data.OldjQueryFails) { return; }
            }

            var parsedNodes = parseHtmlFragment(data.html, document);

            // Assert that we have the expected collection of elements (not just the correct .innerHTML string)
            expect(parsedNodes.length).toEqual(data.parsed.length);
            for (var i = 0; i < parsedNodes.length; i++) {
                testNode.innerHTML = '';
                testNode.appendChild(parsedNodes[i]);
                expect(testNode).toContainHtml(data.parsed[i], function(htmlToClean) {
                    // Old IE strips quotes from certain attributes. The easiest way of normalising this across
                    // browsers is to forcibly strip the equivalent quotes in all browsers for the test.
                    return htmlToClean.replace(/"x"/g, 'x');
                });
            }
        });
    });

    it("returns copies of the nodes", function () {
        var html = '<div><i></i></div>';
        var parsedNodes1 = parseHtmlFragment(html, document);
        var parsedNodes2 = parseHtmlFragment(html, document);
        expect(parsedNodes1).toNotEqual(parsedNodes2);
        expect(parsedNodes1[0]).toNotEqual(parsedNodes2[0]);
        // We need to test for deep inequality
        expect(parsedNodes1[0].children[0]).toNotEqual(parsedNodes2[0].children[0]);
    });
});
