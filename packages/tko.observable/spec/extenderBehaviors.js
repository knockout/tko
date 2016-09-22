
import {
    subscribable as Subscribable,
    extenders
} from '../index';

describe('Extenders', function() {
    it('Should be able to extend any subscribable', function () {
        extenders.setDummyProperty = function(target, value) {
            target.dummyProperty = value;
        };

        var subscribable = new Subscribable();
        expect(subscribable.dummyProperty).toEqual(undefined);

        subscribable.extend({ setDummyProperty : 123 });
        expect(subscribable.dummyProperty).toEqual(123);
    });

    it('Should be able to chain extenders', function() {
        extenders.wrapInParentObject = function(target /*, value */) {
            return { inner : target, extend : target.extend };
        };
        var underlyingSubscribable = new Subscribable();
        var result = underlyingSubscribable.extend({ wrapInParentObject:true }).extend({ wrapInParentObject:true });
        expect(result.inner.inner).toEqual(underlyingSubscribable);
    });
});
