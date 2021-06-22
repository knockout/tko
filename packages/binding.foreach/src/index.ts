import { ForEachBinding } from './foreach'

export var bindings = {
  foreach: ForEachBinding
}

// By default, foreach will be async.
ForEachBinding.setSync(false)
