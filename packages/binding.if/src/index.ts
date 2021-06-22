
import {
  IfBindingHandler,
  UnlessBindingHandler
} from './ifUnless'

import {
  WithBindingHandler
} from './with'

import {
  ElseBindingHandler
} from './else'

export const bindings = {
  'if': IfBindingHandler,
  'with': WithBindingHandler,
  ifnot: UnlessBindingHandler,
  unless: UnlessBindingHandler,
  'else': ElseBindingHandler,
  'elseif': ElseBindingHandler
}
