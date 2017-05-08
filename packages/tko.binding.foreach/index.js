import { foreach } from './src/foreach.js';

export var bindings = {
  foreach: foreach
};

// By default, foreach will be async.
foreach.setSync(false);
