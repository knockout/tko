/// <reference types="jasmine" />
/// <reference types="jquery" />

//export {} allows redefining window module, see https://bobbyhadz.com/blog/typescript-make-types-global
export { };

declare global {

    interface Window {
        // Below just informs IDE and/or TS-compiler (it's set in `.js` file).
        DEBUG: boolean
        amdRequire: any
        require: any
        jQuery: JQueryStatic
        jQueryInstance: JQueryStatic
        testDivTemplate: HTMLElement
        templateOutput: HTMLElement
        innerShiv // For IE
        o: () => ObservableArray // For jsxBehaviors Test
    }

    //Jasmine and Mocha define duplicated functions, is a problem for the type system
    //This namespace merges the jasmine namespace to correct same tsc warnings
    namespace jasmine {      
       
        function setNodeText(node, text: string): void
        var Spec: any;
        function getGlobal(): any;
        var updateInterval: number
        function resolve(promise: Promise<boolean>)
        function prepareTestNode() : HTMLElement
        function nodeText(node)
        var Clock: Clock
        function getEnv(): any;

        var FakeTimer: any
        var undefined: undefined
        var browserSupportsProtoAssignment: any
        var ieVersion: any

        var Matchers: Matchers

        interface Matchers<T> {
            toContainText(expected: string, ignoreSpaces: boolean): boolean
            toHaveOwnProperties(expectedProperties: any): boolean
            toHaveTexts(expectedTexts: any): boolean
            toHaveValues(expectedValues: any): boolean
            toHaveCheckedStates(expectedValues: any): boolean
            toThrowContaining(expected: any): boolean
            toEqualOneOf(expectedPossibilities: any): boolean
            toContainHtml(expectedHtml: any, postProcessCleanedHtml: any): boolean
            toHaveSelectedValues(expectedValues: any): boolean
            toContainHtml(expectedValues: any): boolean
            toHaveNodeTypes(expectedTypes: any): boolean
            toContainHtmlElementsAndText(expectedHtml: any): boolean
        }

        interface Clock {
            mockScheduler: any
        }

        interface Spy {
            reset(): any
        }
    }


    //#region Knockout Types https://github.com/knockout/knockout/blob/master/build/types/knockout.d.ts#L404
    // Type definitions for Knockout
    // Project: http://knockoutjs.com
    // Definitions by: Maxime LUCE <https://github.com/SomaticIT>, Michael Best <https://github.com/mbest>

    // Treeshaked for TKO: Many type definitions are moved to the TKO source.
    // Some global types remain here because refactoring leads to invasive changes. 
    // Change prototype-chains of the TKO base classes to js/ts classes can be later steps.

    //#region binding/bindingAttributeSyntax.js

    // usage in multiprovider.ts, provider.ts, attributeMustacheProvider.ts
    export interface ProviderParamsInput{
        bindingHandlers?: BindingHandlerObject;
        globals?:any;
        attributesToSkip?:any;
        attributesBindingMap?:any;
        providers?:any[];
      }

    // usage in applyBindings, BindingHandler, event, checked, options
    export interface AllBindings {
        (): any;

        get(name: string): any;
        get<T>(name: string): T;

        has(name: string): boolean;
    }

    // transfered to LegacyBindingHandler.ts
    export type BindingHandlerControlsDescendant = { controlsDescendantBindings: boolean; }
    export type BindingHandlerAddBinding = (name: string, value: any) => void;
    // used as Base for all BindingHandlers

    //!  => moved into bind/BindingHandler.ts
    export interface BindingHandler<T = any> {
        after?: string[];
        init?: (element: any, valueAccessor: () => T, allBindings: AllBindings, viewModel: any, bindingContext: BindingContext<any>) => void | BindingHandlerControlsDescendant;
        update?: (element: any, valueAccessor: () => T, allBindings: AllBindings, viewModel: any, bindingContext: BindingContext<any>) => void;
        options?: any;
        preprocess?: (value: string | undefined, name: string, addBinding: BindingHandlerAddBinding) => string | undefined | void;
    }

    export interface BindingHandlers {
        [name: string]: BindingHandler;
    }

    // global usage. defined in bindingContext.ts
    export interface BindingContext<T = any> {
        ko: any; // typeof ko;

        [symbol: symbol]: any
        $parent?: any;
        $parents: any[];
        $root: any;
        $data: T;
        $rawData: T | Observable<T>;
        $index?: Observable<number>;
        $parentContext?: BindingContext<any>;
        // $componentTemplateNodes: any; added in makeChildBindingContext to context
        // $componentTemplateSlotNodes; added in makeChildBindingContext to context

        $component?: any;

        extend(properties: object): BindingContext<T>;
        extend(properties: (self: BindingContext<T>) => object): BindingContext<T>;

        createChildContext(dataItemOrAccessor: any, dataItemAlias?: string, extendCallback?: Function, settings?: BindingContextSetting): BindingContext;
        createStaticChildContext(dataItemOrAccessor: any, dataItemAlias: any): BindingContext;
    }

    //#region templating/templating.js

    export interface BindingHandlers {
        template: {
            init(element: Node, valueAccessor: () => MaybeSubscribable<any>): BindingHandlerControlsDescendant;
            update(element: Node, valueAccessor: () => MaybeSubscribable<any>, allBindings: AllBindings, viewModel: any, bindingContext: BindingContext<any>): void;
        };
    }

    //#endregion

    //#region templating/templateSources.js

    export interface TemplateSource {
        text(): string;
        text(valueToWrite: string): void;

        data(key: string): any;
        data<T>(key: string): T;
        data<T>(key: string, valueToWrite: T): void;

        nodes?: {
            (): Node;
            (valueToWrite: Node): void;
        };
    }

    export module templateSources {
        export class domElement implements TemplateSource {
            constructor(element: Node);

            text(): string;
            text(valueToWrite: string): void;

            data(key: string): any;
            data<T>(key: string): T;
            data<T>(key: string, valueToWrite: T): void;

            nodes(): Node;
            nodes(valueToWrite: Node): void;
        }

        export class anonymousTemplate extends domElement {
            constructor(element: Node);
        }
    }

    //#endregion

    //#region components/componentBinding.js

    export interface BindingHandlers {
        component: {
            init(element: Node, valueAccessor: () => MaybeSubscribable<{ name: any; params: any; }>, allBindings: AllBindings, viewModel: any, bindingContext: BindingContext<any>): BindingHandlerControlsDescendant;
        };
    }

    //#endregion

    interface SymbolConstructor {
        observable?: Symbol;
    }

    export interface Computed<T = any> extends ComputedFunctions<T> {
        (): T;
        (value: T): this;
    }

    export interface ComputedFunctions<T = any> extends Subscribable<T> {
        // It's possible for a to be undefined, since the equalityComparer is run on the initial
        // computation with undefined as the first argument. This is user-relevant for deferred computeds.
        equalityComparer(a: T | undefined, b: T): boolean;
        peek(): T;
        dispose(): void;
        isActive(): boolean;
        getDependenciesCount(): number;
        getDependencies(): Subscribable[];
    }

    // used in computed, but empty interface is pointless. Check if it's needed
    export interface PureComputed<T = any> extends Computed<T> { }

    export type ComputedReadFunction<T = any, TTarget = void> = Subscribable<T> | Observable<T> | Computed<T> | ((this: TTarget) => T);
    export type ComputedWriteFunction<T = any, TTarget = void> = (this: TTarget, val: T) => void;
    export type MaybeComputed<T = any> = T | Computed<T>;


    export interface ComputedOptions<T = any, TTarget = void> {
        read?: ComputedReadFunction<T, TTarget>;
        write?: ComputedWriteFunction<T, TTarget>;
        owner?: TTarget;
        pure?: boolean;
        deferEvaluation?: boolean;
        disposeWhenNodeIsRemoved?: Node;
        disposeWhen?: () => boolean;
    }

    export module computed {
        export const fn: ComputedFunctions;
    }


    //#region Subscribable

    export type SubscriptionCallback<T = any, TTarget = void> = (this: TTarget, val: T) => void;
    export type MaybeSubscribable<T = any> = T | Subscribable<T>;

    //moved to subribable.ts
    export interface SubscribableFunctions<T = any> {
        [symbol: symbol]: boolean;
        init<any>(instance: any): void;

        notifySubscribers(valueToWrite?: T, event?: string): void;

        subscribe<TTarget = void>(callback: SubscriptionCallback<T, TTarget> | any, callbackTarget?: TTarget, event?: string): Subscription;
        extend(requestedExtenders: any): this;
        extend<S extends Subscribable<T>>(requestedExtenders: any): S;

        getSubscriptionsCount(event?: string): number;
        // TKO

        getVersion(): number;
        hasChanged(versionToCheck: number): boolean;
        updateVersion(): void;
        hasSubscriptionsForEvent(event: string): boolean;
        isDifferent<T>(oldValue?: T, newValue?: T): boolean;
        once(cb: Function): void;
        when(test, returnValue?);
        yet(test: Function | any, args: any[]): void;
        next(): Promise<unknown>;
        toString(): string;

        // From pureComputedOverrides in computed.ts
        beforeSubscriptionAdd?: (event: string) => void;
        afterSubscriptionRemove?: (event: string) => void;
    }

    export interface Subscribable<T = any> extends SubscribableFunctions<T> {
        _subscriptions: any;
        _versionNumber: number;
    }

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

        //TKO
        modify(fn, peek = true): Observable
    }

    export interface Observable<T = any> extends ObservableFunctions<T> {
        subprop?: string; // for some test
        [symbol: symbol]: any;
        (): T;
        (value: T): any;
    }
    export function observable<T>(initialValue?: T): Observable<T>;
    // export function observable<T = any>(value: null): Observable<T | null>
    /** No initial value provided, so implicitly includes `undefined` as a possible value */
    // export function observable<T = any>(): Observable<T | undefined>
    export module observable {
        export const fn: ObservableFunctions;
    }

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
        compareArrayOptions?: CompareArraysOptions;
        cacheDiffForKnownOperation?: (rawArray: any[], operationName: string, args: any[]) => void;
    }

    export function observableArray<T = any>(initialValue: T[]): ObservableArray<T>;
    export module observableArray {
        export const fn: ObservableArrayFunctions;
    }

    //#endregion ObservableArray
}
