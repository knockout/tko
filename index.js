import {$if, $with, ifnot} from './src/ifIfnotWith'
//import {template} from './src/template'
//    'let': letBinding,
//    template: template,

export var bindings = {
    'if': $if,
    'with': $with,
    ifnot: ifnot, unless: ifnot,
};
