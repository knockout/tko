/// <reference types="jasmine" />
/// <reference types="jquery" />

import { Observable, ObservableArray } from "packages/observable/types/Observable";

export { };


declare global {

    // export type Observable<T= any> = {
    //     (): T; // Getter
    //     (value: T): void; // Setter
    //     subscribe(callback: (newValue: T) => void): Subscription;
    //   };

    // export type Subscription = {
    //     dispose(): void; // Unsubscribe method
    //   };

    // export type ObservableArray<T> = Observable<T[]> & {
    //     remove (valueOrPredicate: any): any[]
    //     removeAll (arrayOfValues: undefined): any
    //     destroy (valueOrPredicate: any): void
    //     destroyAll (arrayOfValues: undefined): any
    //     indexOf (item: any): number
    //     replace (oldItem: any, newItem: any): void
    //     sorted (compareFn: ((a: any, b: any) => number) | undefined): any[]
    //     reversed (): any[]
    //     [Symbol.iterator]: Generator<any, void, any>

    //     // Array-specific methods
    //     push(...items: T[]): number;
    //     pop(): T | undefined;
    //     unshift(...items: T[]): number;
    //     shift(): T | undefined;
    //     splice(start: number, deleteCount?: number, ...items: T[]): T[];
    //     slice(start?: number, end?: number): T[];
    //     // remove(item: T): T[];
    //     // remove(predicate: (item: T) => boolean): T[];
    //     // removeAll(): T[];
    //     // removeAll(items: T[]): T[];
    //     // destroy(item: T): void;
    //     // destroy(predicate: (item: T) => boolean): void;
    //     // destroyAll(): void;
    //     // destroyAll(items: T[]): void;
    //     // replace(oldItem: T, newItem: T): void;
    //     // indexOf(item: T): number;
    //     // sorted(compareFn?: (a: T, b: T) => number): T[];
    //     // filter(predicate: (item: T) => boolean): T[];
    //     // map<U>(callback: (item: T) => U): U[];
    //   };



    //#region Knockout Types https://github.com/knockout/knockout/blob/master/build/types/knockout.d.ts#L404

    // Type definitions for Knockout v3.5.0
    // Project: http://knockoutjs.com
    // Definitions by: Maxime LUCE <https://github.com/SomaticIT>, Michael Best <https://github.com/mbest>

   // export as namespace ko;

    //#region subscribables/subscribable.js

    // Moved to packages/observable/types/Observable.d.ts

    //#endregion

    //#region subscribables/observable.js

    // Moved to packages/observable/types/Observable.d.ts

    //#endregion

    //#region subscribables/observableArray.js

    // Moved to packages/observable/types/Observable.d.ts

    //#endregion

    //#region subscribables/dependendObservable.js

    // Moved to packages/computed/types/Computed.d.ts

    //#endregion

    //#region subscribables/dependencyDetection.js

    export interface ComputedContext {
        getDependenciesCount(): number;
        getDependencies(): Subscribable[];
        isInitial(): boolean;
        registerDependency(subscribable: Subscribable): void;
    }

    export const computedContext: ComputedContext;

    /**
     * Executes a function and returns the result, while disabling depdendency tracking
     * @param callback - the function to execute without dependency tracking
     * @param callbackTarget - the `this` binding for `callback`
     * @param callbackArgs - the args to provide to `callback`
     */
    export function ignoreDependencies<Return, Target, Args extends any[]>(
        callback: (this: Target, ...args: Args) => Return,
        callbackTarget?: Target,
        callbackArgs?: Args
    ): Return;

    //#endregion

    //#region subscribables/extenders.js

    export type RateLimitMethod = (callback: () => void, timeout: number, options: any) => (() => void);

    export interface RateLimitOptions {
        timeout: number;
        method?: "notifyAtFixedRate" | "notifyWhenChangesStop" | RateLimitMethod;
        [option: string]: any;
    }

    export interface ExtendersOptions<T = any> {
        trackArrayChanges: true | utils.CompareArraysOptions;
        throttle: number;
        rateLimit: number | RateLimitOptions;
        deferred: true;
        notify: "always" | any;
    }

    export interface Extender<T extends Subscribable = any, O = any> {
        (target: T, options: O): T;
    }

    type AsExtenders<T> = { [P in keyof T]: Extender<Subscribable, T[P]> }

    export interface Extenders<T> extends AsExtenders<ExtendersOptions<T>> {
        [name: string]: Extender;
    }

    export interface ObservableExtenderOptions<T> extends Partial<ExtendersOptions<T>> { }

    export const extenders: Extenders<any>;

    //#endregion

    //#region subscribables/mappingHelpers.js

    export type Unwrapped<T> = T extends ko.ObservableArray<infer R>
        ? Unwrapped<R>[]
        : T extends ko.Subscribable<infer R>
        ? (
            R extends ko.Subscribable
            ? unknown
            : R extends Record<any, any>
            ? { [P in keyof R]: Unwrapped<R[P]> }
            : R
        )
        : T extends Date | RegExp | Function
        ? T
        : T extends Record<any, any>
        ? { [P in keyof T]: Unwrapped<T[P]> }
        : T

    export function toJS<T>(rootObject: T): Unwrapped<T>;
    export function toJSON(rootObject: any, replacer?: Function, space?: number): string;

    //#endregion

    //#region subscribables/observableUtils.js

    export function when<T, TTarget = void>(predicate: ComputedReadFunction<T, TTarget>, callback: SubscriptionCallback<T, TTarget>, context?: TTarget): Subscription;
    export function when<T>(predicate: ComputedReadFunction<T, void>): Promise<T>;

    //#endregion

    //#region binding/bindingAttributeSyntax.js

    export type BindingAccessors = { [name: string]: Function; };

    export interface AllBindings {
        (): any;

        get(name: string): any;
        get<T>(name: string): T;

        has(name: string): boolean;
    }
    export type BindingHandlerControlsDescendant = { controlsDescendantBindings: boolean; }
    export type BindingHandlerAddBinding = (name: string, value: any) => void;
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

    export interface BindingContext<T = any> {
        ko: any; // typeof ko;

        [name: string]: any;

        $parent?: any;
        $parents: any[];
        $root: any;
        $data: T;
        $rawData: T | Observable<T>;
        $index?: Observable<number>;
        $parentContext?: BindingContext<any>;

        $component?: any;

        extend(properties: object): BindingContext<T>;
        extend(properties: (self: BindingContext<T>) => object): BindingContext<T>;

        createChildContext<X>(dataItem: T | Observable<T>, dataItemAlias?: string, extendCallback?: BindingContextExtendCallback<X>): BindingContext<X>;
        createChildContext<X>(accessor: () => T | Observable<T>, dataItemAlias?: string, extendCallback?: BindingContextExtendCallback<X>): BindingContext<X>;
        createChildContext<X>(dataItem: T | Observable<T>, options: BindingChildContextOptions<X>): BindingContext<X>;
        createChildContext<X>(accessor: () => T | Observable<T>, options: BindingChildContextOptions<X>): BindingContext<X>;
    }

    export interface BindingChildContextOptions<T = any> {
        as?: string;
        extend?: BindingContextExtendCallback<T>;
        noChildContext?: boolean;
    }

    export function applyBindings<T = any>(bindingContext: T | BindingContext<T>): void;
    export function applyBindings<T = any>(bindingContext: T | BindingContext<T>, rootNode: Node, extendCallback?: BindingContextExtendCallback<T>): void;
    export function applyBindingsToDescendants<T = any>(bindingContext: T | BindingContext<T>, rootNode?: Node): void;
    export function applyBindingsToNode<T = any>(node: Node, bindings: object | (() => object), viewModel: T | BindingContext<T>): void;
    export function applyBindingAccessorsToNode<T = any>(node: Node, bindings: BindingAccessors | (() => BindingAccessors), viewModel: T | BindingContext<T>): void;

    export function dataFor<T = any>(node: Node): T;
    export function contextFor<T = any>(node: Node): BindingContext<T>;

    export const bindingHandlers: BindingHandlers;
    export function getBindingHandler(handler: string): BindingHandler;

    export type BindingContextExtendCallback<T = any> = (self: BindingContext<T>, parentContext: BindingContext<T> | null, dataItem: T) => void;

    export module bindingEvent {
        export function subscribe(node: Node, event: "childrenComplete" | "descendantsComplete", callback: (node: Node) => void, callbackContext?: any): Subscription;
        export function startPossiblyAsyncContentBinding(node: Element, bindingContext: BindingContext): BindingContext;
    }

    //#endregion

    //#region binding/bindingProvider.js

    export interface BindingOptions {
        valueAccessors?: boolean;
        bindingParams?: boolean;
    }

    export interface IBindingProvider {
        nodeHasBindings(node: Node): boolean;
        getBindings?(node: Node, bindingContext: BindingContext<any>): object;
        getBindingAccessors(node: Node, bindingContext: BindingContext<any>): BindingAccessors;
        preprocessNode?(node: Node): Node[] | undefined;
    }

    export class bindingProvider implements IBindingProvider {
        nodeHasBindings(node: Node): boolean;

        getBindings(node: Node, bindingContext: BindingContext<any>): object;
        getBindingAccessors(node: Node, bindingContext: BindingContext<any>): BindingAccessors;

        getBindingsString(node: Node, bindingContext?: BindingContext<any>): string;

        parseBindingsString(bindingsString: string, bindingContext: BindingContext<any>, node: Node): object;
        parseBindingsString(bindingsString: string, bindingContext: BindingContext<any>, node: Node, options: BindingOptions): object | BindingAccessors;

        static instance: IBindingProvider;
    }

    //#endregion

    //#region binding/expressionRewriting.js
    export module expressionRewriting {
        export interface KeyValue {
            key?: string;
            value?: string;
            unknown?: string;
        }

        export interface TwoWayBindings {
            [name: string]: boolean | string;
        }

        export const bindingRewriteValidators: any[];

        export function parseObjectLiteral(objectLiteralString: string): KeyValue[];

        export function preProcessBindings(bindingsString: string, bindingOptions?: BindingOptions): string;
        export function preProcessBindings(keyValueArray: KeyValue[], bindingOptions?: BindingOptions): string;

        export const _twoWayBindings: TwoWayBindings;
    }

    //#endregion


    //#region binding/defaultBindings/

    export interface BindingHandlers {
        // Controlling text and appearance
        visible: {
            update(element: HTMLElement, valueAccessor: () => MaybeSubscribable<any>): void;
        };
        hidden: {
            update(element: HTMLElement, valueAccessor: () => MaybeSubscribable<any>): void;
        };
        text: {
            init(): BindingHandlerControlsDescendant;
            update(element: Node, valueAccessor: () => MaybeSubscribable<string>): void;
        };
        html: {
            init(): BindingHandlerControlsDescendant;
            update(element: Node, valueAccessor: () => MaybeSubscribable<string>): void;
        };
        class: {
            update(element: HTMLElement, valueAccessor: () => MaybeSubscribable<string>): void;
        };
        css: {
            update(element: HTMLElement, valueAccessor: () => MaybeSubscribable<string | object>): void;
        };
        style: {
            update(element: HTMLElement, valueAccessor: () => MaybeSubscribable<object>): void;
        };
        attr: {
            update(element: HTMLElement, valueAccessor: () => MaybeSubscribable<object>): void;
        };

        // Control Flow
        foreach: {
            init(element: Node, valueAccessor: () => MaybeSubscribable<any[] | any>, allBindings: AllBindings, viewModel: any, bindingContext: BindingContext<any>): BindingHandlerControlsDescendant;
        };
        if: {
            init(element: Node, valueAccessor: () => MaybeSubscribable<any>, allBindings: AllBindings, viewModel: any, bindingContext: BindingContext<any>): BindingHandlerControlsDescendant;
        };
        ifnot: {
            init(element: Node, valueAccessor: () => MaybeSubscribable<any>, allBindings: AllBindings, viewModel: any, bindingContext: BindingContext<any>): BindingHandlerControlsDescendant;
        };
        with: {
            init(element: Node, valueAccessor: () => MaybeSubscribable<any>, allBindings: AllBindings, viewModel: any, bindingContext: BindingContext<any>): BindingHandlerControlsDescendant;
        };
        let: {
            init(element: Node, valueAccessor: () => MaybeSubscribable<object>, allBindings: AllBindings, viewModel: any, bindingContext: BindingContext<any>): BindingHandlerControlsDescendant;
        };
        using: {
            init(element: Node, valueAccessor: () => MaybeSubscribable<any>, allBindings: AllBindings, viewModel: any, bindingContext: BindingContext<any>): BindingHandlerControlsDescendant;
        };

        // Working with form fields
        event: {
            init(element: HTMLElement, valueAccessor: () => object, allBindings: AllBindings, viewModel: any, bindingContext: BindingContext<any>): void;
        };
        click: {
            init(element: HTMLElement, valueAccessor: () => Function, allBindings: AllBindings, viewModel: any, bindingContext: BindingContext<any>): void;
        };
        submit: {
            init(element: HTMLElement, valueAccessor: () => Function, allBindings: AllBindings, viewModel: any, bindingContext: BindingContext<any>): void;
        };
        enable: {
            update(element: HTMLElement, valueAccessor: () => MaybeSubscribable<any>): void;
        };
        disable: {
            update(element: HTMLElement, valueAccessor: () => MaybeSubscribable<any>): void;
        };
        value: {
            after: string[];
            init(element: HTMLElement, valueAccessor: () => MaybeSubscribable<any>, allBindings: AllBindings): void;
            update(...args: any[]): void; // Keep for backwards compatibility with code that may have wrapped value binding
        };
        textInput: {
            init(element: HTMLElement, valueAccessor: () => MaybeSubscribable<string>, allBindings: AllBindings): void;
        };
        textinput: {
            preprocess(value: string | undefined, name: string, addBinding: BindingHandlerAddBinding): void;
        };
        hasfocus: {
            init(element: HTMLElement, valueAccessor: () => MaybeSubscribable<any>, allBindings: AllBindings): void;
            update(element: HTMLElement, valueAccessor: () => MaybeSubscribable<any>): void;
        };
        hasFocus: {
            init(element: HTMLElement, valueAccessor: () => MaybeSubscribable<any>, allBindings: AllBindings): void;
            update(element: HTMLElement, valueAccessor: () => MaybeSubscribable<any>): void;
        };
        checked: {
            after: string[];
            init(element: HTMLElement, valueAccessor: () => MaybeSubscribable<any>, allBindings: AllBindings): void;
        };
        checkedValue: {
            update(element: HTMLElement, valueAccessor: () => MaybeSubscribable<any>): void;
        };
        options: {
            init(element: HTMLElement): BindingHandlerControlsDescendant;
            update(element: HTMLElement, valueAccessor: () => MaybeSubscribable<any>, allBindings: AllBindings): void;
        };
        selectedOptions: {
            after: string[];
            init(element: HTMLElement, valueAccessor: () => MaybeSubscribable<any>, allBindings: AllBindings): void;
            update(element: HTMLElement, valueAccessor: () => MaybeSubscribable<any>): void;
        };
        uniqueName: {
            init(element: HTMLElement, valueAccessor: () => boolean): void;
        };
    }

    //#endregion

    //#region binding/editDetection/compareArrays.js

    export module utils {
        export interface ArrayChange<T = any> {
            status: "added" | "deleted" | "retained";
            value: T;
            index: number;
            moved?: number;
        }

        export type ArrayChanges<T = any> = ArrayChange<T>[];

        export interface CompareArraysOptions {
            dontLimitMoves?: boolean;
            sparse?: boolean;
        }

        export function compareArrays<T = any>(a: T[], b: T[]): ArrayChanges<T>;
        export function compareArrays<T = any>(a: T[], b: T[], dontLimitMoves: boolean): ArrayChanges<T>;
        export function compareArrays<T = any>(a: T[], b: T[], options: CompareArraysOptions): ArrayChanges<T>;
    }

    //#endregion

    //#region binding/editDetection/arrayToDomNodeChildren.js

    export module utils {
        export type MappingFunction<T = any> = (valueToMap: T, index: number, nodes: Node[]) => Node[];
        export type MappingAfterAddFunction<T = any> = (arrayEntry: T, nodes: Node[], index: Observable<number>) => Node[];
        export type MappingHookFunction<T = any> = (nodes: Node[], index: number, arrayEntry: T) => void;

        export interface MappingOptions<T = any> {
            dontLimitMoves?: boolean;
            beforeMove?: MappingHookFunction<T>;
            beforeRemove?: MappingHookFunction<T>;
            afterAdd?: MappingHookFunction<T>;
            afterMove?: MappingHookFunction<T>;
            afterRemove?: MappingHookFunction<T>;
        }

        export function setDomNodeChildrenFromArrayMapping<T = any>(domNode: Node, array: T[], mapping: MappingFunction<T>, options?: MappingOptions<T>, callbackAfterAddingNodes?: MappingAfterAddFunction<T>): void;
    }

    //#endregion

    //#region templating/templating.js

    export interface TemplateOptions<T = any> {
        afterRender?: (elements: Node[], dataItem: T) => void;
        templateEngine?: templateEngine;
    }

    export interface TemplateForeachOptions<T = any> extends TemplateOptions<T[]>, utils.MappingOptions<T> {
        as?: string;
        includeDestroyed?: boolean;
    }

    export interface BindingTemplateOptions extends TemplateOptions, utils.MappingOptions {
        name?: string | ((val: any) => string);
        nodes?: Node[];

        if?: boolean;
        ifnot?: boolean;

        data?: any;
        foreach?: any[];

        as?: string;
        includeDestroyed?: boolean;
    }

    export interface BindingHandlers {
        template: {
            init(element: Node, valueAccessor: () => MaybeSubscribable<string | BindingTemplateOptions>): BindingHandlerControlsDescendant;
            update(element: Node, valueAccessor: () => MaybeSubscribable<string | BindingTemplateOptions>, allBindings: AllBindings, viewModel: any, bindingContext: BindingContext<any>): void;
        };
    }

    export function renderTemplate(template: string | Node | (() => string | Node)): string;
    export function renderTemplate<T = any>(template: string | Node | (() => string | Node), dataOrBindingContext: T | BindingContext<T> | null | undefined, options?: TemplateOptions<T> | null | undefined): string;
    export function renderTemplate<T = any>(template: string | Node | (() => string | Node), dataOrBindingContext: T | BindingContext<T> | null | undefined, options: TemplateOptions<T> | null | undefined, targetNodeOrNodeArray: Node | Node[], renderMode?: "replaceChildren" | "replaceNode" | "ignoreTargetNode"): Computed<void>;

    export function setTemplateEngine(templateEngine: templateEngine | undefined): void;

    //#endregion

    //#region templating/templateEngine.js

    export abstract class templateEngine {
        allowTemplateRewriting: boolean;

        abstract renderTemplateSource(templateSource: TemplateSource, bindingContext: BindingContext<any>, options: TemplateOptions<any>, templateDocument?: Document): Node[];
        createJavaScriptEvaluatorBlock(script: string): string;

        makeTemplateSource(template: string | Node, templateDocument?: Document): TemplateSource;

        renderTemplate(template: string | Node, bindingContext: BindingContext<any>, options: TemplateOptions<any>, templateDocument?: Document): Node[];

        isTemplateRewritten(template: string | Node, templateDocument?: Document): boolean;

        rewriteTemplate(template: string | Node, rewriterCallback: (val: string) => string, templateDocument?: Document): void;
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

    //#region templating/native/nativeTemplateEngine.js

    export class nativeTemplateEngine extends templateEngine {
        renderTemplateSource(templateSource: TemplateSource, bindingContext: BindingContext<any>, options: TemplateOptions<any>, templateDocument?: Document): Node[];
    }

    //#endregion

    //#region components/componentBinding.js

    export interface BindingHandlers {
        component: {
            init(element: Node, valueAccessor: () => MaybeSubscribable<{ name: any; params: any; }>, allBindings: AllBindings, viewModel: any, bindingContext: BindingContext<any>): BindingHandlerControlsDescendant;
        };
    }

    //#endregion



    //#region components/defaultLoader.js

    export module components {
        export interface ViewModelConstructor {
            new(params?: ViewModelParams): ViewModel;
        }

        export interface ViewModel {
            dispose?: () => void;
            koDescendantsComplete?: (node: Node) => void;
        }

        export interface ViewModelParams {
            [name: string]: any;
        }

        export interface ComponentInfo {
            element: Node;
            templateNodes: Node[];
        }

        export type CreateViewModel = (params: ViewModelParams, componentInfo: ComponentInfo) => ViewModel;

        export interface Component {
            template: Node[];
            createViewModel?: CreateViewModel;
        }

        export interface ViewModelStatic {
            instance: any;
        }
        export interface ViewModelFactory {
            createViewModel: CreateViewModel;
        }
        export interface TemplateElement {
            element: string | Node;
        }

        export type ViewModelConfig = ViewModelConstructor | ViewModelStatic | ViewModelFactory;
        export type TemplateConfig = string | Node[] | DocumentFragment | TemplateElement;
        export interface RequireConfig {
            require: string;
        }
        export interface Config {
            require?: string;
            viewModel?: RequireConfig | ViewModelConfig | any;
            template?: RequireConfig | TemplateConfig | any;
            synchronous?: boolean;
        }

        export function register(componentName: string, config: Config | object): void;
        export function unregister(componentName: string): void;
        export function isRegistered(componentName: string): boolean;

        export interface Loader {
            getConfig?(componentName: string, callback: (config: Config | object) => void): void;
            loadComponent?(componentName: string, config: Config | object, callback: (component: Component | null) => void): void;
            loadTemplate?(componentName: string, config: TemplateConfig | any, callback: (resolvedTemplate: Node[] | null) => void): void;
            loadViewModel?(componentName: string, config: ViewModelConfig | any, callback: (resolvedViewModel: CreateViewModel | null) => void): void;
        }

        export const loaders: Loader[];

        export interface DefaultLoader extends Loader {
            getConfig(componentName: string, callback: (config: Config | object) => void): void;
            loadComponent(componentName: string, config: Config, callback: (component: Component) => void): void;
            loadTemplate(componentName: string, config: TemplateConfig, callback: (resolvedTemplate: Node[]) => void): void;
            loadViewModel(componentName: string, config: ViewModelConfig, callback: (resolvedViewModel: CreateViewModel) => void): void;
        }

        export const defaultLoader: DefaultLoader;
    }

    //#endregion

    //#region utils.js

    export module utils {
        export interface PostJsonOptions {
            params?: object;
            includeFields?: string[];
            submitter?: (form: HTMLFormElement) => void;
        }

        export function extend<T = any, U = any>(target: T, source: U): T & U;

        export const fieldsIncludedWithJsonPost: Array<string | RegExp>;

        export function getFormFields(form: HTMLFormElement, fieldName: string | RegExp): any[];

        export function objectForEach(obj: object, action: (key: string, value: any) => void): void;
        export function objectForEach<T = any>(obj: { [key: string]: T }, action: (key: string, value: T) => void): void;

        export function peekObservable<T = any>(value: MaybeSubscribable<T>): T;

        export function postJson(urlOrForm: string | HTMLFormElement, data: MaybeSubscribable<object>, options?: PostJsonOptions): void;

        export function parseJson(jsonString: string): any;
        export function parseJson<T = any>(jsonString: string): T;

        export function range(min: MaybeSubscribable<number>, max: MaybeSubscribable<number>): number[];

        export function registerEventHandler(element: Element, eventType: string, handler: EventListener): void;

        export function setTextContent(element: Node, textContent: MaybeSubscribable<string>): void;

        export function stringifyJson(data: MaybeSubscribable<any>, replacer?: Function, space?: string | number): string;

        export function toggleDomNodeCssClass(node: Element, className: string, shouldHaveClass?: boolean): void;

        export function triggerEvent(element: Element, eventType: string): void;

        export function unwrapObservable<T = any>(value: MaybeSubscribable<T>): T;
    }

    export function unwrap<T = any>(value: MaybeSubscribable<T>): T;

    //#endregion

    interface SymbolConstructor {
        observable?: Symbol;
    }


    var testNode: HTMLElement;
    var jQueryInstance: JQueryStatic;

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
        function setNodeText (node, text:string):void
        var Spec: any;
        function getGlobal(): any;
        var updateInterval: number
        function resolve(promise: Promise<boolean>)
        function prepareTestNode()
        function nodeText(node)
        var Clock: Clock
        function getEnv(): any;

        var FakeTimer: any
        var undefined: undefined
        var browserSupportsProtoAssignment: any
        var ieVersion: any

        var Matchers:Matchers

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
            toHaveNodeTypes  (expectedTypes: any): boolean
            toContainHtmlElementsAndText (expectedHtml : any) : boolean
        }

        interface Clock {
            mockScheduler: any
        }

        interface Spy {
            reset(): any
        }
    }
}
