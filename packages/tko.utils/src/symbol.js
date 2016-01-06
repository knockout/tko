//
// ES6 Symbols
//

export var useSymbols = typeof Symbol === 'function';

export function createSymbolOrString(identifier) {
    return useSymbols ? Symbol(identifier) : identifier;
}
