//#region Subscribable


export type SubscriptionCallback<T = any, TTarget = void> = (this: TTarget, val: T) => void;
export type MaybeSubscribable<T = any> = T | Subscribable<T>;

export interface Subscription {
    dispose(): void;
    disposeWhenNodeIsRemoved(node: Node): void;
}

type Flatten<T> = T extends Array<infer U> ? U : T;

export interface SubscribableFunctions<T = any> extends Function {
    init<S extends Subscribable<any>>(instance: S): void;

    notifySubscribers(valueToWrite?: T, event?: string): void;

    subscribe<TTarget = void>(callback: SubscriptionCallback<utils.ArrayChanges<Flatten<T>>, TTarget>, callbackTarget: TTarget, event: "arrayChange"): Subscription;

    subscribe<TTarget = void>(callback: SubscriptionCallback<T, TTarget>, callbackTarget: TTarget, event: "beforeChange" | "spectate" | "awake"): Subscription;
    subscribe<TTarget = void>(callback: SubscriptionCallback<undefined, TTarget>, callbackTarget: TTarget, event: "asleep"): Subscription;
    subscribe<TTarget = void>(callback: SubscriptionCallback<T, TTarget>, callbackTarget?: TTarget, event?: "change"): Subscription;
    subscribe<X = any, TTarget = void>(callback: SubscriptionCallback<X, TTarget>, callbackTarget: TTarget, event: string): Subscription;

    extend(requestedExtenders: ObservableExtenderOptions<T>): this;
    extend<S extends Subscribable<T>>(requestedExtenders: ObservableExtenderOptions<T>): S;

    getSubscriptionsCount(event?: string): number;
}

export interface Subscribable<T = any> extends SubscribableFunctions<T> { }

export const subscribable: {
    new <T = any>(): Subscribable<T>;
    fn: SubscribableFunctions;
};

export function isSubscribable<T = any>(instance: any): instance is Subscribable<T>;


//#endregion


//#region Observable 

export type MaybeObservable<T = any> = T | Observable<T>;

export interface ObservableFunctions<T = any> extends Subscribable<T> {
    equalityComparer(a: T, b: T): boolean;
    peek(): T;
    valueHasMutated(): void;
    valueWillMutate(): void;
}

export interface Observable<T = any> extends ObservableFunctions<T> {
    subprop: string; // for some test
    (): T;
    (value: T): any;
    valueWillMutate();
}
export function observable<T>(value: T): Observable<T>;
export function observable<T = any>(value: null): Observable<T | null>
/** No initial value provided, so implicitly includes `undefined` as a possible value */
export function observable<T = any>(): Observable<T | undefined>
export module observable {
    export const fn: ObservableFunctions;
}

export function isObservable<T = any>(instance: any): instance is Observable<T>;

export function isWriteableObservable<T = any>(instance: any): instance is Observable<T>;
export function isWritableObservable<T = any>(instance: any): instance is Observable<T>;

//#endregion Observable 

//#region ObservableArray

export type MaybeObservableArray<T = any> = T[] | ObservableArray<T>;

export interface ObservableArrayFunctions<T = any> extends ObservableFunctions<T[]> {
    //#region observableArray/generalFunctions
    /**
      * Returns the index of the first occurrence of a value in an array.
      * @param searchElement The value to locate in the array.
      * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
      */
    indexOf(searchElement: T, fromIndex?: number): number;

    /**
      * Returns a section of an array.
      * @param start The beginning of the specified portion of the array.
      * @param end The end of the specified portion of the array. If omitted, all items after start are included
      */
    slice(start: number, end?: number): T[];

    /**
     * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
     * @param start The zero-based location in the array from which to start removing elements.
     * @param deleteCount The number of elements to remove. Defaults to removing everything after `start`
     * @param items Elements to insert into the array in place of the deleted elements.
     */
    splice(start: number, deleteCount?: number, ...items: T[]): T[];

    /**
     * Removes the last value from the array and returns it.
     */
    pop(): T;
    /**
     * Adds a new item to the end of array.
     * @param items Items to be added
     */
    push(...items: T[]): number;
    /**
     * Removes the first value from the array and returns it.
     */
    shift(): T;
    /**
     * Inserts a new item at the beginning of the array.
     * @param items Items to be added
     */
    unshift(...items: T[]): number;

    /**
     * Reverses the order of the array and returns the observableArray.
     * Modifies the underlying array.
     */
    reverse(): this;

    /**
     * Sorts the array contents and returns the observableArray.
     * Modifies the underlying array.
     */
    sort(compareFunction?: (left: T, right: T) => number): this;
    //#endregion

    //#region observableArray/koSpecificFunctions
    /**
     * Returns a reversed copy of the array.
     * Does not modify the underlying array.
     */
    reversed(): T[];

    /**
     * Returns a reversed copy of the array.
     * Does not modify the underlying array.
     */
    sorted(compareFunction?: (left: T, right: T) => number): T[];
    /**
     * Replaces the first value that equals oldItem with newItem
     * @param oldItem Item to be replaced
     * @param newItem Replacing item
     */
    replace(oldItem: T, newItem: T): void;

    /**
     * Removes all values that equal item and returns them as an array.
     * @param item The item to be removed
     */
    remove(item: T): T[];
    /**
     * Removes all values  and returns them as an array.
     * @param removeFunction A function used to determine true if item should be removed and fasle otherwise
     */
    remove(removeFunction: (item: T) => boolean): T[];

    /**
     * Removes all values and returns them as an array.
     */
    removeAll(): T[];
    /**
     * Removes all values that equal any of the supplied items
     * @param items Items to be removed
     */
    removeAll(items: T[]): T[];

    // Ko specific Usually relevant to Ruby on Rails developers only
    /**
     * Finds any objects in the array that equal someItem and gives them a special property called _destroy with value true.
     * Usually only relevant to Ruby on Rails development
     * @param item Items to be marked with the property.
     */
    destroy(item: T): void;
    /**
     * Finds any objects in the array filtered by a function and gives them a special property called _destroy with value true.
     * Usually only relevant to Ruby on Rails development
     * @param destroyFunction A function used to determine which items should be marked with the property.
     */
    destroy(destroyFunction: (item: T) => boolean): void;

    /**
     * Gives a special property called _destroy with value true to all objects in the array.
     * Usually only relevant to Ruby on Rails development
     */
    destroyAll(): void;
    /**
     * Finds any objects in the array that equal supplied items and gives them a special property called _destroy with value true.
     * Usually only relevant to Ruby on Rails development
     * @param items
     */
    destroyAll(items: T[]): void;
    //#endregion
}

export interface ObservableArray<T = any> extends Observable<T[]>, ObservableArrayFunctions<T> {
    (value: T[] | null | undefined): this;
}

export function observableArray<T = any>(): ObservableArray<T>;
export function observableArray<T = any>(initialValue: T[]): ObservableArray<T>;
export module observableArray {
    export const fn: ObservableArrayFunctions;
}

export function isObservableArray<T = any>(instance: any): instance is ObservableArray<T>;

//#endregion ObservableArray