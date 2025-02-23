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

    interface SymbolConstructor {
        observable?: Symbol;
    }

    //#region Subscribable - TODO need help - can move this def to package, constructor-methode from subscribable is to special

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
        _id: number;
    }

    export const subscribable: {
        new <T = any>(): Subscribable<T>;
        fn: SubscribableFunctions;
    };

    //#endregion
  
}
