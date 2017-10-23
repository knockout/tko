
import {
  IfBindingHandler,
  ElseBindingHandler,
  UnlessBindingHandler,
  WithBindingHandler
} from './ifIfnotWith'

export const bindings = {
  'if': IfBindingHandler,
  'with': WithBindingHandler,
  ifnot: UnlessBindingHandler,
  unless: UnlessBindingHandler,
  'else': ElseBindingHandler,
  'elseif': ElseBindingHandler
}
