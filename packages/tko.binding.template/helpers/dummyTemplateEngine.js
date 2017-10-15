
import {
  extend, arrayPushAll, parseHtmlFragment
} from 'tko.utils';

import {
    renderTemplate, anonymousTemplate, templateEngine
} from '../src';


export function dummyTemplateEngine(templates) {
    var inMemoryTemplates = templates || {};
    var inMemoryTemplateData = {};

    function dummyTemplateSource(id) {
        this.id = id;
    }
    dummyTemplateSource.prototype = {
        text: function(val) {
            if (arguments.length >= 1)
                inMemoryTemplates[this.id] = val;
            return inMemoryTemplates[this.id];
        },
        data: function(key, val) {
            if (arguments.length >= 2) {
                inMemoryTemplateData[this.id] = inMemoryTemplateData[this.id] || {};
                inMemoryTemplateData[this.id][key] = val;
            }
            return (inMemoryTemplateData[this.id] || {})[key];
        }
    };

    this.makeTemplateSource = function(template) {
        if (typeof template == "string")
            return new dummyTemplateSource(template); // Named template comes from the in-memory collection
        else if ((template.nodeType == 1) || (template.nodeType == 8))
            return new anonymousTemplate(template); // Anonymous template
    };

    this.renderTemplateSource = function (templateSource, bindingContext, rt_options, templateDocument) {
        var data = bindingContext['$data'];
        if (data && typeof data.get_value === 'function') {
            // For cases when data is an Identifier/Expression.
            data = data.get_value(data, bindingContext);
        }
        templateDocument = templateDocument || document;
        rt_options = rt_options || {};
        var templateText = templateSource.text();
        if (typeof templateText == "function")
            templateText = templateText(data, rt_options);

        templateText = rt_options.showParams ? templateText + ", data=" + data + ", options=" + rt_options : templateText;
        // var templateOptions = options.templateOptions; // Have templateOptions in scope to support [js:templateOptions.foo] syntax

        var result;

        data = data || {};
         // Rollup mangles `data` to e.g. `data$$1`.  This workaround works
         // as long as nomangle$data doesn't appear anywhere not in tests.
        var nomangle$data = data
        rt_options.templateRenderingVariablesInScope = rt_options.templateRenderingVariablesInScope || {};

        extend(data, rt_options.templateRenderingVariablesInScope);

        // Dummy [renderTemplate:...] syntax
        result = templateText.replace(/\[renderTemplate\:(.*?)\]/g, function (match, templateName) {
          return renderTemplate(templateName, data, rt_options);
        });


        var evalHandler = function (match, script) {
            try {
                var evalResult = eval(script);
                return (evalResult === null) || (evalResult === undefined) ? "" : evalResult.toString();
            } catch (ex) {
                throw new Error("Error evaluating script: [js: " + script + "]\n\nException: " + ex.toString());
            }
        };

        // Dummy [[js:...]] syntax (in case you need to use square brackets inside the expression)
        result = result.replace(/\[\[js\:([\s\S]*?)\]\]/g, evalHandler);

        // Dummy [js:...] syntax
        result = result.replace(/\[js\:([\s\S]*?)\]/g, evalHandler);
        /*with (bindingContext) {
            with (data || {}) {
                with (options.templateRenderingVariablesInScope || {}) {

                }
            }
        }*/

        // Use same HTML parsing code as real template engine so as to trigger same combination of IE weirdnesses
        // Also ensure resulting nodelist is an array to mimic what the default templating engine does, so we see the effects of not being able to remove dead memo comment nodes.
        return arrayPushAll([], parseHtmlFragment(result, templateDocument));
    };

    this.rewriteTemplate = function (template, rewriterCallback, templateDocument) {
        // Only rewrite if the template isn't a function (can't rewrite those)
        var templateSource = this.makeTemplateSource(template, templateDocument);
        if (typeof templateSource.text() != "function")
            return templateEngine.prototype.rewriteTemplate.call(this, template, rewriterCallback, templateDocument);
    };
    this.createJavaScriptEvaluatorBlock = function (script) { return "[js:" + script + "]"; };
}


dummyTemplateEngine.prototype = new templateEngine();
