
import {
  IfBindingHandler,
  ElseBindingHandler,
  UnlessBindingHandler,
  WithBindingHandler
} from './src/ifIfnotWith'

export const bindings = {
  'if': IfBindingHandler,
  'with': WithBindingHandler,
  ifnot: UnlessBindingHandler,
  unless: UnlessBindingHandler,
  'else': ElseBindingHandler,
  'elseif': ElseBindingHandler
}
