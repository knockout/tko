// If you want to make a custom template engine,
//
// [1] Inherit from this class (like ko.nativeTemplateEngine does)
// [2] Override 'renderTemplateSource', supplying a function with this signature:
//
//        function (templateSource, bindingContext, options) {
//            // - templateSource.text() is the text of the template you should render
//            // - bindingContext.$data is the data you should pass into the template
//            //   - you might also want to make bindingContext.$parent, bindingContext.$parents,
//            //     and bindingContext.$root available in the template too
//            // - options gives you access to any other properties set on "data-bind: { template: options }"
//            // - templateDocument is the document object of the template
//            //
//            // Return value: an array of DOM nodes
//        }
//
// [3] Override 'createJavaScriptEvaluatorBlock', supplying a function with this signature:
//
//        function (script) {
//            // Return value: Whatever syntax means "Evaluate the JavaScript statement 'script' and output the result"
//            //               For example, the jquery.tmpl template engine converts 'someScript' to '${ someScript }'
//        }
//
//     This is only necessary if you want to allow data-bind attributes to reference arbitrary template variables.
//     If you don't want to allow that, you can set the property 'allowTemplateRewriting' to false (like ko.nativeTemplateEngine does)
//     and then you don't need to override 'createJavaScriptEvaluatorBlock'.

import {
  extend, options
} from 'tko.utils';

import {
  domElement, anonymousTemplate
} from './templateSources';

export function templateEngine() { };

extend(templateEngine.prototype, {
  renderTemplateSource: function (templateSource, bindingContext, options, templateDocument) {
      options.onError("Override renderTemplateSource");
  },

  createJavaScriptEvaluatorBlock: function (script) {
      options.onError("Override createJavaScriptEvaluatorBlock");
  },

  makeTemplateSource: function(template, templateDocument) {
      // Named template
      if (typeof template == "string") {
          templateDocument = templateDocument || document;
          var elem = templateDocument.getElementById(template);
          if (!elem)
              options.onError("Cannot find template with ID " + template);
          return new domElement(elem);
      } else if ((template.nodeType == 1) || (template.nodeType == 8)) {
          // Anonymous template
          return new anonymousTemplate(template);
      } else
          options.onError("Unknown template type: " + template);
  },

  renderTemplate: function (template, bindingContext, options, templateDocument) {
      var templateSource = this['makeTemplateSource'](template, templateDocument);
      return this.renderTemplateSource(templateSource, bindingContext, options, templateDocument);
  }
})
