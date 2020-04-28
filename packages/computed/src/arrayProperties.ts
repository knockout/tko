/**
 * This is an observable extender for adding chained, computed arrays from
 * existing observable arrays.  The method names and parameters
 * mirror those of the underlying array, but their return type is
 * a pure-computed that must be unwrapped/peeked to obtain the underlying
 * value.
 *
 * Usage:  observable.extend({ arrayProperties: true })
 */
import { pureComputed } from './computed'

const STATIC_ARRAY_PROPERTIES = [
  'length',
  'forEach',
  Symbol.iterator
]

const computableArrayProperties = [
  'indexOf',
  'lastIndexOf',
  'entries',
  'every',
  'find',
  'findIndex',
  'reduce',
  'reduceRight',
  'some'
] as const

const computableArrayToArray = [
  'slice',
  'filter',
  'keys',
  'map',
  'flat',
  'flatMap',
  'values'
] as const

/**
 * @target {Observable|object} Extend the observable, or extend
 *    ko.observableArray.fn.
 */
export default function arrayProperties (
  target: KnockoutObservable<any> | KnockoutComputed<any>,
  params: true,
) {
  const properties: Record<string, any> = {}

  for (const prop of computableArrayProperties) {
    properties[prop] = {
      value (...args: any[]) {
        return pureComputed(() => this()[prop](...args))
      }
    }
  }

  for (const prop of computableArrayToArray) {
    properties[prop] = {
      value (...args: any[]) {
        return pureComputed(() => this()[prop](...args))
          .extend({ arrayProperties: true })
      }
    }
  }

  Object.defineProperties(target, properties)
  if (typeof target === 'function') {
    target.extend({ proxy: STATIC_ARRAY_PROPERTIES })
  } else {
    Object.defineProperties(target, {
      forEach: { value (...args: any[]) { return target().forEach(...args) } }
    })
  }
}

type ArrayToArrayTypes = typeof computableArrayToArray[number]
type ArrayToPropertyTypes = typeof computableArrayProperties[number]

type ArrayProperties<T> = {
  [P in ArrayToPropertyTypes]: (...args: Parameters<Array<T>[P]>) => KnockoutComputed<ReturnType<Array<T>[P]>>
}

type ArrayToArray<T> = {
  [P in ArrayToArrayTypes]: (...args: Parameters<Array<T>[P]>) => KnockoutComputed<ReturnType<Array<T>[P]>>
}

/**
 * The KnockoutArrayProperties<T> type augments the properties in the
 * ObservableArray or Computed with the underlying ES5+ properties of
 * an array.
 *
 * These methods can be chained, returning a computed:
 * e.g. `obs.map(v => v * 2).filter(v => v > 12)` returns a
 */
export interface KnockoutArrayProperties<T = any> extends ArrayToArray<T>, ArrayProperties<T> {
  length: number
  forEach: Array<T>['forEach']
  [Symbol.iterator]: IterableIterator<T>
}


declare global {
  export interface KnockoutExtenders {
    arrayProperties: typeof arrayProperties
  }
}
