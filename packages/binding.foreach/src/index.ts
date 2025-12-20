import { ForEachBinding } from './foreach'

export const bindings = {
  foreach: ForEachBinding
}

// By default, foreach will be async.
ForEachBinding.setSync(false)
