//
// ES6 Symbols
//

export const useSymbols = typeof Symbol === 'function'

export function createSymbolOrString (identifier) {
  return useSymbols ? Symbol(identifier) : identifier
}
