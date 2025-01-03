/// <reference types="jasmine" />
/// <reference types="jquery" />


export { };


declare global {

    export type Observable<T> = {
        (): T; // Getter
        (value: T): void; // Setter
        subscribe(callback: (newValue: T) => void): Subscription;
      };
      
    export type Subscription = {
        dispose(): void; // Unsubscribe method
      };
      
    export type ObservableArray<T> = Observable<T[]> & {
        remove (valueOrPredicate: any): any[]
        removeAll (arrayOfValues: undefined): any
        destroy (valueOrPredicate: any): void
        destroyAll (arrayOfValues: undefined): any
        indexOf (item: any): number
        replace (oldItem: any, newItem: any): void
        sorted (compareFn: ((a: any, b: any) => number) | undefined): any[]
        reversed (): any[]
        [Symbol.iterator]: Generator<any, void, any>
        
        // Array-specific methods
        push(...items: T[]): number;
        pop(): T | undefined;
        unshift(...items: T[]): number;
        shift(): T | undefined;
        splice(start: number, deleteCount?: number, ...items: T[]): T[];
        slice(start?: number, end?: number): T[];
        // remove(item: T): T[];
        // remove(predicate: (item: T) => boolean): T[];
        // removeAll(): T[];
        // removeAll(items: T[]): T[];
        // destroy(item: T): void;
        // destroy(predicate: (item: T) => boolean): void;
        // destroyAll(): void;
        // destroyAll(items: T[]): void;
        // replace(oldItem: T, newItem: T): void;
        // indexOf(item: T): number;
        // sorted(compareFn?: (a: T, b: T) => number): T[];
        // filter(predicate: (item: T) => boolean): T[];
        // map<U>(callback: (item: T) => U): U[];
      };
    
    var testNode: HTMLElement;
    var jQueryInstance : JQuery

  
    interface Window {
        // Below just informs IDE and/or TS-compiler (it's set in `.js` file).
        DEBUG: boolean
        amdRequire: any
        require: any
        jQuery: JQuery
        jQueryInstance: JQuery
    }

    //Jasmine and Mocha define duplicated functions, is a problem for the type system
    //This namespace merges the jasmine namespace to correct same tsc warnings
    namespace jasmine {
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

        interface Matchers<T> {

            toContainText(expected: string, ignoreSpaces: boolean) : boolean
            toHaveOwnProperties(expectedProperties : any) : boolean
            toHaveTexts (expectedTexts : any) : boolean
            toHaveValues (expectedValues : any) : boolean
            toHaveCheckedStates (expectedValues : any) : boolean
            toThrowContaining(expected : any) : boolean
            toEqualOneOf (expectedPossibilities : any) : boolean
            toContainHtml (expectedHtml : any, postProcessCleanedHtml : any) : boolean
            toHaveSelectedValues(expectedValues : any) : boolean
            toContainHtml(expectedValues:any):boolean
        }

        interface Spy {
            reset() : any
        }
    }
}