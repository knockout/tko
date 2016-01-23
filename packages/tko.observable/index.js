//
// Observables.
// ---
//
// The following are added to the root `[t]ko` object.
//
import { unwrap, peek } from './src/observable';
export {
    observable, isObservable, unwrap, peek,
    isWriteableObservable, isWritableObservable
} from './src/observable';
export { isSubscribable, subscribable } from './src/subscribable';
export { observableArray } from './src/observableArray';
export { trackArrayChanges, arrayChangeEventName } from './src/observableArray.changeTracking';
export { toJS, toJSON } from './src/mappingHelpers';
export { deferUpdates } from './src/defer.js';

import * as extenders from './src/extenders';

import * as dependencyDetection from './src/dependencyDetection';
export { extenders, dependencyDetection };


// Attach unwrap/peek-Observable to tko.utils
import * as utils from 'tko.utils';

utils.setUnwrapObservableFn(unwrap);
utils.setPeekObservableFn(peek);
