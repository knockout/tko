
import {
  TemplateForEachBindingHandler
} from './src/foreach'

import {
  TemplateBindingHandler
} from './src/templating'
//    'let': letBinding,
//    template: template,

export const bindings = {
  foreach: TemplateForEachBindingHandler,
  template: TemplateBindingHandler
}

export * from './src/nativeTemplateEngine'
export * from './src/templateEngine'
export * from './src/templating'
export * from './src/templateSources'
