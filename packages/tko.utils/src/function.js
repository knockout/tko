
function testOverwrite () {
  try {
    Object.defineProperty(function x () {}, 'length', {})
    return true
  } catch (e) {
    return false
  }
}

export const functionSupportsLengthOverwrite = testOverwrite()

export function overwriteLengthPropertyIfSupported (fn, descriptor) {
  if (functionSupportsLengthOverwrite) {
    Object.defineProperty(fn, 'length', descriptor)
  }
}
