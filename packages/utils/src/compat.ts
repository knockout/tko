// Compat passthroughs preserving the public @tko/utils API after the
// post-Symbol/post-IE9 polyfill removals. Each function delegates to a
// native API; kept so consumers importing these names continue to work.
// All entries here are slated for removal in the next major version.

/**
 * @deprecated Use `Symbol(identifier)` directly. Will be removed in a future major.
 */
export function createSymbolOrString(identifier: string): symbol {
  return Symbol(identifier)
}

/**
 * @deprecated Use `String(value ?? '').trim()` directly (or `String.prototype.trim`
 * when the input is known to be a string). Will be removed in a future major.
 */
export function stringTrim(value: any): string {
  return String(value ?? '').trim()
}

/**
 * @deprecated Use `String.prototype.startsWith` directly. Will be removed in a future major.
 */
export function stringStartsWith(value: string, prefix: string): boolean {
  return (value ?? '').startsWith(prefix)
}

/**
 * @deprecated Use `Object.defineProperty(fn, 'length', descriptor)` directly.
 * Will be removed in a future major.
 */
export function overwriteLengthPropertyIfSupported(fn: Function, descriptor: PropertyDescriptor): void {
  Object.defineProperty(fn, 'length', descriptor)
}
