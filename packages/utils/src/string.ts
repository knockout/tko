//
// String (and JSON)
//

export function stringTrim(str: string) {
  return str === null || str === undefined ? ''
        : str.trim
            ? str.trim()
            : str.toString().replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
}

export function stringStartsWith(str: string, startsWith: string) {
  str = str || '';
  if (startsWith.length > str.length) { return false; }
  return str.substring(0, startsWith.length) === startsWith;
}

export function parseJson(jsonString: string) {
  if (typeof jsonString === 'string') {
    jsonString = stringTrim(jsonString);
    if (jsonString) {
      if (JSON && JSON.parse) { return JSON.parse(jsonString); } // Use native parsing where available
      return (new Function('return ' + jsonString))(); // Fallback on less safe parsing for older browsers
    }
  }
  return null;
}
