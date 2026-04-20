//
// String (and JSON)
//

export function stringTrim(value: unknown): string {
  return value == null ? '' : String(value).trim()
}

export function stringStartsWith(value: string | null | undefined, prefix: string): boolean {
  return (value ?? '').startsWith(prefix)
}

export function parseJson<T = any>(jsonString: string): T | null {
  if (typeof jsonString === 'string') {
    const trimmed = jsonString.trim()
    if (trimmed) {
      return JSON.parse(trimmed) as T
    }
  }
  return null
}
