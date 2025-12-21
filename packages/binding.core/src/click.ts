import { makeEventHandlerShortcut } from './event'

// 'click' is just a shorthand for the usual full-length event:{click:handler}
export const click = makeEventHandlerShortcut('click')
