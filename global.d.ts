/// <reference types="jasmine" />
/// <reference types="jquery" />

//export {} allows redefining window module
export {}

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
    function prepareTestNode(): HTMLElement
    function nodeText(node)
    function getEnv(): any

    const Matchers: Matchers
    const Spec: any
    const FakeTimer: any
    const undefined: any // Legacy Jasmine 1.x sentinel value

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
      toContainHtml(expectedHtml: any, postProcessCleanedHtml?: any): boolean
      toHaveSelectedValues(expectedValues: any): boolean
      toHaveNodeTypes(expectedTypes: any): boolean
      toContainHtmlElementsAndText(expectedHtml: any): boolean
    }

    interface Clock {
      mockScheduler: any
      reset(): void
      useMock(): void
    }

    interface Spy {
      reset(): any
      andCallFake(fn: Function): Spy
    }
  }

  // Jasmine 1.x async test helpers (deprecated but still used in codebase)
  function waits(timeout?: number): void
  function runs(fn: Function): void

  interface SymbolConstructor {
    observable?: symbol
  }
}
