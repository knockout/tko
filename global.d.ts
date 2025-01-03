/// <reference types="jasmine" />
/// <reference types="jquery" />


export { };

declare global {

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

            toContainText(expected: string, ignoreSpaces: boolean) : boolean;
            toHaveOwnProperties(expectedProperties : any) : boolean;
            toThrowContaining(expected : any): boolean;
        }

        interface Spy {
            reset() : any
        }
    }
}