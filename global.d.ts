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
  }

  interface SymbolConstructor {
    observable?: symbol
  }
}
