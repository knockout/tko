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
    }

    export const subscribable: {
        new <T = any>(): Subscribable<T>;
        fn: SubscribableFunctions;
    };

    export function isSubscribable<T = any>(instance: any): instance is Subscribable<T>;


    //#endregion
  
}
