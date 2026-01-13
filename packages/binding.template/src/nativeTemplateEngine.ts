import { makeArray, parseHtmlFragment } from '@tko/utils'
import { templateEngine, type TemplateOptions } from './templateEngine'
import { setTemplateEngine } from './templating'
import type { TemplateSource } from './templateSources'
import type { BindingContext } from '@tko/bind'

export function nativeTemplateEngine() {}

nativeTemplateEngine.prototype = new templateEngine()
nativeTemplateEngine.prototype.constructor = nativeTemplateEngine
nativeTemplateEngine.prototype.renderTemplateSource = function (
  templateSource: TemplateSource,
  bindingContext: BindingContext<any>,
  options: TemplateOptions<any>,
  templateDocument?: Document
): Node[] {
  const templateNodes = templateSource.nodes ? templateSource.nodes() : null

  if (templateNodes) {
    return makeArray(templateNodes.cloneNode(true).childNodes)
  } else {
    const templateText = templateSource.text()
    return parseHtmlFragment(templateText, templateDocument)
  }
}

nativeTemplateEngine.instance = new nativeTemplateEngine()
setTemplateEngine(nativeTemplateEngine.instance)
