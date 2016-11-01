
import {$if, $with, ifnot, $else} from './src/ifIfnotWith';

export var bindings = {
    'if': $if,
    'with': $with,
    ifnot: ifnot, unless: ifnot,
    'else': $else,
    'elseif': $else
};