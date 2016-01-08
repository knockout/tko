//
//  Defer Updates
//  ===
//
import { tasks } from 'tko.utils';


export function deferUpdates(target) {
    if (!target._deferUpdates) {
        target._deferUpdates = true;
        target.limit(function (callback) {
            var handle;
            return function () {
                tasks.cancel(handle);
                handle = tasks.schedule(callback);
                target.notifySubscribers(undefined, 'dirty');
            };
        });
    }
}
