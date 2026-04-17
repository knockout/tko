import { extend, arrayPushAll, parseHtmlFragment } from '@tko/utils'
import { unwrap } from '@tko/observable'

import { renderTemplate, anonymousTemplate, templateEngine } from '../dist'

import type { BindingContext } from '@tko/bind'

export function dummyTemplateEngine(templates?) {
  const inMemoryTemplates = templates || {}
  const inMemoryTemplateData = {}

  function dummyTemplateSource(id) {
    this.id = id
  }
  dummyTemplateSource.prototype = {
    text: function (val) {
      if (arguments.length >= 1) inMemoryTemplates[this.id] = val
      return inMemoryTemplates[this.id]
    },
    data: function (key, val) {
      if (arguments.length >= 2) {
        inMemoryTemplateData[this.id] = inMemoryTemplateData[this.id] || {}
        inMemoryTemplateData[this.id][key] = val
      }
      return (inMemoryTemplateData[this.id] || {})[key]
    }
  }

  this.makeTemplateSource = function (template) {
    if (typeof template == 'string')
      return new dummyTemplateSource(template) // Named template comes from the in-memory collection
    else if (template.nodeType === Node.ELEMENT_NODE || template.nodeType === Node.COMMENT_NODE)
      return new anonymousTemplate(template) // Anonymous template
  }

  this.renderTemplateSource = function (templateSource, bindingContext: BindingContext, rt_options, templateDocument) {
    let data = bindingContext['$data']
    if (data && typeof data.get_value === 'function') {
      // For cases when data is an Identifier/Expression.
      data = data.get_value(data, bindingContext)
    }
    templateDocument = templateDocument || document
    rt_options = rt_options || {}
    let templateText = templateSource.text()
    if (typeof templateText == 'function') templateText = templateText(data, rt_options)

    templateText = rt_options.showParams ? templateText + ', data=' + data + ', options=' + rt_options : templateText
    // var templateOptions = options.templateOptions; // Have templateOptions in scope to support [js:templateOptions.foo] syntax

    let result

    data = data || {}
    const nomangle$data: any = data

    rt_options.templateRenderingVariablesInScope = rt_options.templateRenderingVariablesInScope || {}

    extend(data, rt_options.templateRenderingVariablesInScope)

    // Dummy [renderTemplate:...] syntax
    result = templateText.replace(/\[renderTemplate\:(.*?)\]/g, function (match, templateName) {
      return renderTemplate(templateName, data, rt_options)
    })

    // Bundlers can rename the closure-captured `unwrap` import (e.g. esbuild's
    // ESM transform), breaking `eval(script)` that references it by name. Pass
    // dependencies explicitly via `new Function` parameters so the evaluator
    // survives any module transform. Scripts come in two flavors — a bare
    // expression (returnable) or a statement list (no implicit return) — so
    // try the expression form first and fall back on syntax error.
    const evalHandler = function (match, script) {
      try {
        let fn: Function
        try {
          fn = new Function('unwrap', 'nomangle$data', 'rt_options', 'bindingContext', `return (${script})`)
        } catch {
          fn = new Function('unwrap', 'nomangle$data', 'rt_options', 'bindingContext', script)
        }
        const evalResult = fn(unwrap, nomangle$data, rt_options, bindingContext)
        return evalResult === null || evalResult === undefined ? '' : evalResult.toString()
      } catch (ex: any) {
        throw new Error('Error evaluating script: [js: ' + script + ']\n\nException: ' + ex.toString(), { cause: ex })
      }
    }

    // Dummy [[js:...]] syntax (in case you need to use square brackets inside the expression)
    result = result.replace(/\[\[js\:([\s\S]*?)\]\]/g, evalHandler)

    // Dummy [js:...] syntax
    result = result.replace(/\[js\:([\s\S]*?)\]/g, evalHandler)
    /*with (bindingContext) {
            with (data || {}) {
                with (options.templateRenderingVariablesInScope || {}) {

                }
            }
        }*/

    // Use same HTML parsing code as real template engine so as to trigger same combination of IE weirdnesses
    // Also ensure resulting nodelist is an array to mimic what the default templating engine does, so we see the effects of not being able to remove dead memo comment nodes.
    return arrayPushAll([], parseHtmlFragment(result, templateDocument))
  }

  this.rewriteTemplate = function (template, rewriterCallback, templateDocument) {
    // Only rewrite if the template isn't a function (can't rewrite those)
    const templateSource = this.makeTemplateSource(template, templateDocument)
    if (typeof templateSource.text() != 'function')
      return templateEngine.prototype.rewriteTemplate.call(this, template, rewriterCallback, templateDocument)
  }
  this.createJavaScriptEvaluatorBlock = function (script) {
    return '[js:' + script + ']'
  }
}

dummyTemplateEngine.prototype = new templateEngine()
