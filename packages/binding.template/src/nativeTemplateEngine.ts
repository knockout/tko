import { ieVersion, makeArray, parseHtmlFragment } from '@tko/utils'
import { templateEngine, TemplateOptions } from './templateEngine'
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
  let version: number
  if (ieVersion instanceof Array) {
    version = parseInt(ieVersion[1], 10)
  } else {
    version = ieVersion ?? 0
  }
  const useNodesIfAvailable = !(version < 9), // IE<9 cloneNode doesn't work properly
    templateNodesFunc = useNodesIfAvailable ? templateSource.nodes : null,
    templateNodes = templateNodesFunc ? templateSource.nodes?.() : null

  if (templateNodes) {
    return makeArray(templateNodes.cloneNode(true).childNodes)
  } else {
    const templateText = templateSource.text()
    return parseHtmlFragment(templateText, templateDocument)
  }
}

nativeTemplateEngine.instance = new nativeTemplateEngine()
setTemplateEngine(nativeTemplateEngine.instance)
