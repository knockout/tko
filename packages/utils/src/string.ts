//
// String (and JSON)
//

export function stringTrim (string) {
  return string === null || string === undefined ? ''
        : string.trim
            ? string.trim()
            : string.toString().replace(/^[\s\xa0]+|[\s\xa0]+$/g, '')
}

export function stringStartsWith (string, startsWith) {
  string = string || ''
  if (startsWith.length > string.length) { return false }
  return string.substring(0, startsWith.length) === startsWith
}

export function parseJson<T = any> (jsonString: string): T | null {
  if (typeof jsonString === 'string') {
    jsonString = stringTrim(jsonString)
    if (jsonString) {
      if (JSON && JSON.parse) {
        // Use native parsing where available
        return JSON.parse(jsonString) as T;
      }
      // Fallback on less safe parsing for older browsers
      return (new Function('return ' + jsonString))() as T
    }
  }
  return null
}
