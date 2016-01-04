//
// ES6 Symbols
//

export var useSymbols = !DEBUG && typeof Symbol === 'function';


export function createSymbolOrString(identifier) {
    return useSymbols ? Symbol(identifier) : identifier;
}
