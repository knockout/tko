
function testOverwrite() {
  try {
    Object.defineProperty(function x() {}, 'length', {});
    return true;
  } catch (e) {
    return false;
  }
}

export const functionSupportsLengthOverwrite = testOverwrite();

// tslint:disable-next-line:ban-types
export function overwriteLengthPropertyIfSupported(fn: Function, descriptor: PropertyDescriptor & ThisType<any>) {
  if (functionSupportsLengthOverwrite) {
    Object.defineProperty(fn, 'length', descriptor);
  }
}
