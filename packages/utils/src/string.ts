//
// String (and JSON)
//

export function parseJson<T = any>(jsonString: string): T | null {
  if (typeof jsonString === 'string') {
    const trimmed = jsonString.trim()
    if (trimmed) {
      return JSON.parse(trimmed) as T
    }
  }
  return null
}
