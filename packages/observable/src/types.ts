
import { LATEST_VALUE } from './subscribable'

/*
    NOTE: In theory this should extend both KnockoutObservable<T[]> and KnockoutReadonlyObservableArray<T>,
        but can't since they both provide conflicting typings of .subscribe.
    So it extends KnockoutObservable<T[]> and duplicates the subscribe definitions, which should be kept in sync
*/
export interface KnockoutObservableArray<T> extends KnockoutExtendedArrayObservable<T>, KnockoutObservableArrayFunctions<T> {
  subscribe(callback: (newValue: KnockoutArrayChange<T>[]) => void, target: any, event: "arrayChange"): KnockoutSubscription;
  subscribe(callback: (newValue: T[]) => void, target: any, event: "beforeChange"): KnockoutSubscription;
  subscribe(callback: (newValue: T[]) => void, target?: any, event?: "change"): KnockoutSubscription;
  subscribe<U>(callback: (newValue: U) => void, target: any, event: string): KnockoutSubscription;

  extend(requestedExtenders: { [key: string]: any; }): KnockoutObservableArray<T>;
}

export interface KnockoutObservableStatic {
  fn: KnockoutObservableFunctions<any>;

  <T>(value: T): KnockoutObservable<T>;
  <T = any>(value: null): KnockoutObservable<T | null>
  <T = any>(): KnockoutObservable<T | undefined>
}


/**
* While all observable are writable at runtime, this type is analogous to the native ReadonlyArray type:
* casting an observable to this type expresses the intention that this observable shouldn't be mutated.
*/
export interface KnockoutReadonlyObservable<T> extends KnockoutSubscribable<T>, KnockoutObservableFunctions<T> {
  /**
   * Unwrap the value, creating a dependency
   */
  (): T;

  /**
   * Returns the current value of the computed observable without creating a
   * dependency.
   */
  peek(): T

  valueHasMutated?: () => void
  valueWillMutate?: () => void

  /**
   * The callback is triggered on the next mutation of the observable.
   */
  once (cb: (v?: T) => any): void
}

export interface KnockoutObservable<T> extends KnockoutReadonlyObservable<T> {
  (value: T): void;

  valueHasMutated (): void

  /**
   * Used for subscribing to the "before" subscription event.
   */
  valueWillMutate (): void

  // Since .extend does arbitrary thing to an observable, it's not safe to do on a readonly observable
  /**
   * Customizes observables basic functionality.
   * @param requestedExtenders Name of the extender feature and it's value, e.g. { notify: 'always' }, { rateLimit: 50 }
   */
  extend(requestedExtenders: { [key: string]: any; }): KnockoutObservable<T>;

  /**
   * Pass in and change the value of the observable.
   *
   * Example: to increment the value `o.modify(x => x++)`
   */
  modify: (op: (v: T) => T) => void
}
