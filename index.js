import {$if, $with, ifnot} from './src/ifIfnotWith'
import {foreach} from './src/foreach'
import {template} from './src/templating'
//    'let': letBinding,
//    template: template,

export var bindings = {
    'if': $if,
    'with': $with,
    ifnot: ifnot, unless: ifnot,
    foreach: foreach,
    template: template
};

export * from './src/nativeTemplateEngine';
export * from './src/templateEngine';
export * from './src/templating';
export * from './src/templateSources';
