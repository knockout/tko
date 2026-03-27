import { Window } from 'happy-dom'

const windowInstance = new Window({ url: 'http://localhost/' })
const overrideKeys = new Set(['window', 'self', 'document', 'navigator', 'location'])

for (const key of Object.getOwnPropertyNames(windowInstance)) {
  if (key in globalThis && !overrideKeys.has(key)) continue
  const descriptor = Object.getOwnPropertyDescriptor(windowInstance, key)
  if (!descriptor) continue
  Object.defineProperty(globalThis, key, {
    configurable: true,
    enumerable: descriptor.enumerable,
    writable: 'writable' in descriptor ? descriptor.writable : true,
    value: 'value' in descriptor ? descriptor.value : windowInstance[key]
  })
}

Object.defineProperty(globalThis, 'window', { configurable: true, value: windowInstance })
Object.defineProperty(globalThis, 'self', { configurable: true, value: windowInstance })
Object.defineProperty(globalThis, 'document', { configurable: true, value: windowInstance.document })
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: windowInstance.navigator })
Object.defineProperty(globalThis, 'location', { configurable: true, value: windowInstance.location })

windowInstance.console = console
