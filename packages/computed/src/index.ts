//
// tko.computed - Exports
//
// knockout -> tko changes:
//      Deprecates `dependentObservable` (use `computed`)
//

export {
    computed,
    isComputed,
    isPureComputed,
    pureComputed
} from './computed'

export type { Computed } from './computed'

export {
    throttleExtender
} from './throttleExtender'

export {
  proxy
} from './proxy'

export {
  when
} from './when'
