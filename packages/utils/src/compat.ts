// Compat passthroughs preserving the public @tko/utils API after the
// post-Symbol/post-IE9 polyfill removals. Each function delegates to a
// native API; kept so consumers importing these names continue to work.
// Removal slated for the next major version.

export function createSymbolOrString(identifier: string): symbol {
  return Symbol(identifier)
}

export function stringTrim(value: any): string {
  return String(value ?? '').trim()
}

export function stringStartsWith(value: string, prefix: string): boolean {
  return value.startsWith(prefix)
}

export function overwriteLengthPropertyIfSupported(
  fn: Function,
  descriptor: PropertyDescriptor,
): void {
  Object.defineProperty(fn, 'length', descriptor)
}
