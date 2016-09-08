import {$if, $with, ifnot} from './src/ifIfnotWith'
import {template} from './src/template'

export var bindings = {
    'if': $if,
    'with': $with,
    ifnot: ifnot, unless: ifnot,
    'let': letBinding,
    template: template,
};
