export function overwriteLengthPropertyIfSupported(fn: Function, descriptor: PropertyDescriptor): void {
  Object.defineProperty(fn, 'length', descriptor)
}
