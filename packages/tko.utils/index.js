/*
  tko.util
  ===


*/

import './src/bind-shim.js'

export * from './src/array.js'
export * from './src/error.js'
export * from './src/event.js'
export * from './src/ie.js'
export * from './src/object.js'
export * from './src/obs.js'
export * from './src/proto.js'
export * from './src/string.js'
export * from './src/symbol.js'
export * from './src/css.js'

// DOM
export * from './src/dom/info.js'
export * from './src/dom/manipulation.js'
export * from './src/dom/fixes.js'
export * from './src/dom/html.js'
export * from './src/dom/disposal.js'


import * as virtualElements from './src/dom/virtualElements.js'
import * as domData from './src/dom/data.js'

export {virtualElements, domData}
