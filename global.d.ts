/// <reference types="jasmine" />
/// <reference types="jquery" />

//export {} allows redefining window module
export { };

declare global {

    // Below just informs IDE and/or TS-compiler (it's set in `.js` file).
    interface Window {
        DEBUG: boolean
        amdRequire: any
        require: any
        jQuery: JQueryStatic
        innerShiv // TODO: For IE<9.. we could also remove it
    }

    //Jasmine and Mocha define duplicated functions, is a problem for the type system
    //This namespace merges the jasmine namespace to correct same tsc warnings
    namespace jasmine {      
       
        function setNodeText(node, text: string): void        
        function getGlobal(): any        
        function resolve(promise: Promise<boolean>)
        function prepareTestNode() : HTMLElement
        function nodeText(node)        
        function getEnv(): any

        const Matchers: Matchers
        const Spec: any;
        const FakeTimer: any
        const undefined: undefined

        let browserSupportsProtoAssignment: any
        let ieVersion: any
        let updateInterval: number        

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

    //Knockout Types https://github.com/knockout/knockout/blob/master/build/types/knockout.d.ts#L404
    // Type definitions for Knockout
    // Project: http://knockoutjs.com
    // Definitions by: Maxime LUCE <https://github.com/SomaticIT>, Michael Best <https://github.com/mbest>

    // Treeshaked for TKO: Almost all type definitions are moved to the TKO source.

    interface SymbolConstructor {
        observable?: symbol;
    } 
}
