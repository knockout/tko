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

import { extend, options } from '@tko/utils'
import { domElement, anonymousTemplate } from './templateSources'
import type { TemplateSource } from './templateSources'
import type { BindingContext } from '@tko/bind'

export interface TemplateOptions<T = any> {
  afterRender?: (elements: Node[], dataItem: T) => void
  templateEngine?: TemplateEngine
}

export interface TemplateEngine {
  allowTemplateRewriting: boolean

  renderTemplateSource(
    templateSource: TemplateSource,
    bindingContext: BindingContext<any>,
    options: TemplateOptions<any>,
    templateDocument?: Document
  ): Node[]
  createJavaScriptEvaluatorBlock(script: string): string

  makeTemplateSource(template: string | Node, templateDocument?: Document): TemplateSource

  renderTemplate(
    template: string | Node,
    bindingContext: BindingContext<any>,
    options: TemplateOptions<any>,
    templateDocument?: Document
  ): Node[]

  isTemplateRewritten(template: string | Node, templateDocument?: Document): boolean

  rewriteTemplate(template: string | Node, rewriterCallback: (val: string) => string, templateDocument?: Document): void
}

//TODO Class-Migration implements TemplateEngine
export function templateEngine() {}

extend(templateEngine.prototype, {
  renderTemplateSource(
    templateSource: TemplateSource,
    bindingContext: BindingContext<any>,
    options,
    templateDocument?: Document
  ) {
    // templateSource, bindingContext, templateDocument not in use
    options.onError('Override renderTemplateSource')
  },

  createJavaScriptEvaluatorBlock(script: string) {
    options.onError(new Error('Override createJavaScriptEvaluatorBlock'))
  },

  makeTemplateSource(template: string | Node, templateDocument?: Document): TemplateSource {
    // Named template
    if (typeof template === 'string') {
      templateDocument = templateDocument || document
      let elem = templateDocument.getElementById(template)
      if (!elem) {
        throw options.onError(new Error('Cannot find template with ID ' + template), false)
      }
      return new domElement(elem)
    } else if (template.nodeType === Node.ELEMENT_NODE || template.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      // Anonymous template
      return new anonymousTemplate(template as Element)
    } else if (template.nodeType === Node.COMMENT_NODE) {
      // Anonymous template stored in a comment node
      return new anonymousTemplate(template as Comment)
    } else {
      throw options.onError(new Error('Unknown template type: ' + template), false)
    }
  },

  renderTemplate(
    template: string | Node,
    bindingContext: BindingContext<any>,
    options: TemplateOptions<any>,
    templateDocument?: Document
  ): Node[] {
    let templateSource = this.makeTemplateSource(template, templateDocument)
    return this.renderTemplateSource(templateSource, bindingContext, options, templateDocument)
  }
})
