
import {
  TemplateForEachBindingHandler
} from './foreach'

import {
  TemplateBindingHandler
} from './templating'
//    'let': letBinding,
//    template: template,

export const bindings = {
  foreach: TemplateForEachBindingHandler,
  template: TemplateBindingHandler
}

export * from './nativeTemplateEngine'
export * from './templateEngine'
export * from './templating'
export * from './templateSources'
