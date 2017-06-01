import { ForEachBinding } from './src/foreach.js'

export var bindings = {
  foreach: ForEachBinding
}

// By default, foreach will be async.
ForEachBinding.setSync(false)
