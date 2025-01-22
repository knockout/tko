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

    // transfered types to dependencyDetection.ts
    // export interface ComputedContext {
    //     getDependenciesCount(): number;
    //     getDependencies(): Subscribable[];
    //     isInitial(): boolean;
    //     registerDependency(subscribable: Subscribable): void;
    // }

    // export const computedContext: ComputedContext;

    /**
     * Executes a function and returns the result, while disabling depdendency tracking
     * @param callback - the function to execute without dependency tracking
     * @param callbackTarget - the `this` binding for `callback`
     * @param callbackArgs - the args to provide to `callback`
     */
    // types transfered to dependencyDetection.ts
    // export function ignoreDependencies<Return, Target, Args extends any[]>(
    //     callback: (this: Target, ...args: Args) => Return,
    //     callbackTarget?: Target,
    //     callbackArgs?: Args
    // ): Return;

    //#endregion

    //#region subscribables/extenders.js

    // no usage anymore
    // export type RateLimitMethod = (callback: () => void, timeout: number, options: any) => (() => void);

    // export interface RateLimitOptions {
    //     timeout: number;
    //     method?: "notifyAtFixedRate" | "notifyWhenChangesStop" | RateLimitMethod;
    //     [option: string]: any;
    // }

    // types transfered to extenders.ts and throttleExpanders.ts
    // export interface ExtendersOptions<T = any> {
    //     trackArrayChanges: true | utils.CompareArraysOptions;
    //     throttle: number;
    //     rateLimit: number | RateLimitOptions;
    //     deferred: true;
    //     notify: "always" | any;
    // }

    // export interface Extender<T extends Subscribable = any, O = any> {
    //     (target: T, options: O): T;
    // }

    // type AsExtenders<T> = { [P in keyof T]: Extender<Subscribable, T[P]> }

    // export interface Extenders<T> extends AsExtenders<ExtendersOptions<T>> {
    //     [name: string]: Extender;
    // }

    // export interface ObservableExtenderOptions<T> extends Partial<ExtendersOptions<T>> { }

    // export const extenders: Extenders<any>;

    //#endregion

    //#region subscribables/mappingHelpers.js

    // transfered to mappingHelpers.ts
    // export type Unwrapped<T> = T extends ko.ObservableArray<infer R>
    //     ? Unwrapped<R>[]
    //     : T extends ko.Subscribable<infer R>
    //     ? (
    //         R extends ko.Subscribable
    //         ? unknown
    //         : R extends Record<any, any>
    //         ? { [P in keyof R]: Unwrapped<R[P]> }
    //         : R
    //     )
    //     : T extends Date | RegExp | Function
    //     ? T
    //     : T extends Record<any, any>
    //     ? { [P in keyof T]: Unwrapped<T[P]> }
    //     : T

    // export function toJS<T>(rootObject: T): Unwrapped<T>;
    // export function toJSON(rootObject: any, replacer?: Function, space?: number): string;

    //#endregion

    //#region subscribables/observableUtils.js

    // types to subscribable
    // export function when<T, TTarget = void>(predicate: ComputedReadFunction<T, TTarget>, callback: SubscriptionCallback<T, TTarget>, context?: TTarget): Subscription;
    // export function when<T>(predicate: ComputedReadFunction<T, void>): Promise<T>;

    //#endregion

    //#region binding/bindingAttributeSyntax.js

    export type BindingAccessors = { [name: string]: Function; };

    // usage in applyBindings, BindingHandler, event, checked, options
    export interface AllBindings {
        (): any;

        get(name: string): any;
        get<T>(name: string): T;

        has(name: string): boolean;
    }
    // transfered to LegacyBindingHandler.ts
    // export type BindingHandlerControlsDescendant = { controlsDescendantBindings: boolean; }
    // export type BindingHandlerAddBinding = (name: string, value: any) => void;
    // used as Base for all BindingHandlers
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



    //#region components/defaultLoader.js //! DONE

    export module components {
        // * Done
        // in utils.component/loaders.ts
        //// export interface DefaultLoader extends Loader {
        ////     getConfig(componentName: string, callback: (config: Config | object) => void): void; // ! DONE
        ////     loadComponent(componentName: string, config: Config, callback: (component: Component) => void): void; // ! DONE
        ////     loadTemplate(componentName: string, config: TemplateConfig, callback: (resolvedTemplate: Node[]) => void): void; // ! DONE
        ////     loadViewModel(componentName: string, config: ViewModelConfig, callback: (resolvedViewModel: CreateViewModel) => void): void; // ! DONE
        //// }
        //// export function register(componentName: string, config: Config | object): void;
        //// export const defaultLoader: DefaultLoader;
        //// export function unregister(componentName: string): void;
        //// export function isRegistered(componentName: string): boolean;
        // just moved into loaders.ts
        ////export interface ViewModelConstructor {
        ////    new(params?: ViewModelParams): ViewModel;
        ////}
        ////export interface ViewModel {
        ////    dispose?: () => void;
        ////    koDescendantsComplete?: (node: Node) => void;
        ////}
        ////export interface ViewModelParams {
        ////    [name: string]: any;
        ////}
        ////export interface ComponentInfo {
        ////    element: Node;
        ////    templateNodes: Node[];
        ////}
        ////export type CreateViewModel = (params: ViewModelParams, componentInfo: ComponentInfo) => ViewModel;
        ////export interface Component {
        ////    template: Node[];
        ////    createViewModel?: CreateViewModel;
        ////}
        ////export interface ViewModelStatic {
        ////    instance: any;
        ////}
        ////export interface ViewModelFactory {
        ////    createViewModel: CreateViewModel;
        ////}
        ////export interface TemplateElement {
        ////    element: string | Node;
        ////}
        ////export type ViewModelConfig = ViewModelConstructor | ViewModelStatic | ViewModelFactory;
        ////export type TemplateConfig = string | Node[] | DocumentFragment | TemplateElement;
        ////export interface RequireConfig {
        ////    require: string;
        ////}
        ////export interface Config {
        ////    require?: string;
        ////    viewModel?: RequireConfig | ViewModelConfig | any;
        ////    template?: RequireConfig | TemplateConfig | any;
        ////    synchronous?: boolean;
        ////}

        // in utils.component/registry.ts
        //// export const loaders: Loader[];
        // ? Needs to be global
        export interface Loader {
            getConfig?(componentName: string, callback: (config: Config | object) => void): void;
            loadComponent?(componentName: string, config: Config | object, callback: (component: Component | null) => void): void;
            loadTemplate?(componentName: string, config: TemplateConfig | any, callback: (resolvedTemplate: Node[] | null) => void): void;
            loadViewModel?(componentName: string, config: ViewModelConfig | any, callback: (resolvedViewModel: CreateViewModel | null) => void): void;
        }
    }

    //#endregion

    //#region utils.js //! DONE

    export module utils {
        //#region Functions
        //! no implementation in TKO
        ////export function postJson(urlOrForm: string | HTMLFormElement, data: MaybeSubscribable<object>, options?: PostJsonOptions): void;

        //// export interface PostJsonOptions {
        ////     params?: object;
        ////     includeFields?: string[];
        ////     submitter?: (form: HTMLFormElement) => void;
        //// }

        //// export const fieldsIncludedWithJsonPost: Array<string | RegExp>;

        //// export function stringifyJson(data: MaybeSubscribable<any>, replacer?: Function, space?: string | number): string;
        ////export function getFormFields(form: HTMLFormElement, fieldName: string | RegExp): any[];

        // * Done
        // in observable/observable.ts
        // export function peekObservable<T = any>(value: MaybeSubscribable<T>): T;
        //  INFO: rename in builder peekObservable => Observable.peek
        // export function unwrapObservable<T = any>(value: MaybeSubscribable<T>): T;
        // INFO: rename in builder unwrapObservable => Observable.unwrap;
        // changed some test  childNodes=>children returns Element and avoids text Nodes that might occure in the testnode definition

        // in utils/object.ts
        //// export function objectForEach(obj: object, action: (key: string, value: any) => void): void;
        // export function objectForEach<T = any>(obj: { [key: string]: T }, action: (key: string, value: T) => void): void;
        // export function extend<T = any, U = any>(target: T, source: U): T & U; // little bit of rewriting needed

        // in utils/string.ts
        //// export function parseJson(jsonString: string): any;
        // export function parseJson<T = any>(jsonString: string): T;

        // in utils/array.ts
        // export function range(min: MaybeSubscribable<number>, max: MaybeSubscribable<number>): number[];

        // in utils/event.ts
        // export function registerEventHandler(element: Element, eventType: string, handler: EventListener): void;
        //  typeguards for IE support added
        // export function triggerEvent(element: Element, eventType: string): void;
        //  typeguards for IE support added

        // in utils/html.ts
        // export function setTextContent(element: Node, textContent: MaybeSubscribable<string>): void;

        // in utils/css.ts
        // export function toggleDomNodeCssClass(node: Element, className: string, shouldHaveClass?: boolean): void;

        //#endregion
    }
    ////export function unwrap<T = any>(value: MaybeSubscribable<T>): T;


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

  export function computed<T = any, TTarget = any>(options: ComputedOptions<T, TTarget>): Computed<T>;
  export function computed<T = any>(evaluator: ComputedReadFunction<T>): Computed<T>;
  export function computed<T = any, TTarget = any>(evaluator: ComputedReadFunction<T, TTarget>, evaluatorTarget: TTarget): Computed<T>;
  export function computed<T = any, TTarget = any>(evaluator: ComputedReadFunction<T, TTarget>, evaluatorTarget: TTarget, options: ComputedOptions<T, TTarget>): Computed<T>;
  export module computed {
      export const fn: ComputedFunctions;
  }

  export function pureComputed<T = any, TTarget = any>(options: ComputedOptions<T, TTarget>): PureComputed<T>;
  export function pureComputed<T = any>(evaluator: ComputedReadFunction<T>): PureComputed<T>;
  export function pureComputed<T = any, TTarget = any>(evaluator: ComputedReadFunction<T, TTarget>, evaluatorTarget: TTarget): PureComputed<T>;



  export function isComputed<T = any>(instance: any): instance is Computed<T>;
  export function isPureComputed<T = any>(instance: any): instance is PureComputed<T>;

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

    // TKO

    when(test, returnValue?)
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

    //TKO
    modify(fn,peek=true):Observable
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
}
