/* eslint no-cond-assign: 0 */
import {
    setPrototypeOfOrExtend, arrayRemoveItem, objectForEach,
    canSetPrototype, setPrototypeOf
} from 'tko.utils';

import { applyExtenders } from './extenders.js';
import * as dependencyDetection from './dependencyDetection.js';


export function subscription(target, callback, disposeCallback) {
    this._target = target;
    this.callback = callback;
    this.disposeCallback = disposeCallback;
    this.isDisposed = false;
}

subscription.prototype.dispose = function () {
    this.isDisposed = true;
    this.disposeCallback();
};

export function subscribable() {
    setPrototypeOfOrExtend(this, ko_subscribable_fn);
    ko_subscribable_fn.init(this);
}

export var defaultEvent = "change";


var ko_subscribable_fn = {
    init: function(instance) {
        instance._subscriptions = {};
        instance._versionNumber = 1;
    },

    subscribe: function (callback, callbackTarget, event) {
        var self = this;

        event = event || defaultEvent;
        var boundCallback = callbackTarget ? callback.bind(callbackTarget) : callback;

        var subscriptionInstance = new subscription(self, boundCallback, function () {
            arrayRemoveItem(self._subscriptions[event], subscriptionInstance);
            if (self.afterSubscriptionRemove)
                self.afterSubscriptionRemove(event);
        });

        if (self.beforeSubscriptionAdd)
            self.beforeSubscriptionAdd(event);

        if (!self._subscriptions[event])
            self._subscriptions[event] = [];
        self._subscriptions[event].push(subscriptionInstance);

        return subscriptionInstance;
    },

    notifySubscribers: function (valueToNotify, event) {
        event = event || defaultEvent;
        if (event === defaultEvent) {
            this.updateVersion();
        }
        if (this.hasSubscriptionsForEvent(event)) {
            try {
                dependencyDetection.begin(); // Begin suppressing dependency detection (by setting the top frame to undefined)
                for (var a = this._subscriptions[event].slice(0), i = 0, subscriptionInstance; subscriptionInstance = a[i]; ++i) {
                    // In case a subscription was disposed during the arrayForEach cycle, check
                    // for isDisposed on each subscription before invoking its callback
                    if (!subscriptionInstance.isDisposed)
                        subscriptionInstance.callback(valueToNotify);
                }
            } finally {
                dependencyDetection.end(); // End suppressing dependency detection
            }
        }
    },

    getVersion: function () {
        return this._versionNumber;
    },

    hasChanged: function (versionToCheck) {
        return this.getVersion() !== versionToCheck;
    },

    updateVersion: function () {
        ++this._versionNumber;
    },

    hasSubscriptionsForEvent: function(event) {
        return this._subscriptions[event] && this._subscriptions[event].length;
    },

    getSubscriptionsCount: function (event) {
        if (event) {
            return this._subscriptions[event] && this._subscriptions[event].length || 0;
        } else {
            var total = 0;
            objectForEach(this._subscriptions, function(eventName, subscriptions) {
                if (eventName !== 'dirty')
                    total += subscriptions.length;
            });
            return total;
        }
    },

    isDifferent: function(oldValue, newValue) {
        return !this.equalityComparer ||
               !this.equalityComparer(oldValue, newValue);
    },

    extend: applyExtenders
};


// For browsers that support proto assignment, we overwrite the prototype of each
// observable instance. Since observables are functions, we need Function.prototype
// to still be in the prototype chain.
if (canSetPrototype) {
    setPrototypeOf(ko_subscribable_fn, Function.prototype);
}

subscribable.fn = ko_subscribable_fn;


export function isSubscribable(instance) {
    return instance != null && typeof instance.subscribe == "function" && typeof instance.notifySubscribers == "function";
}
