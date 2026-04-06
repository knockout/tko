import { isComputed, isPureComputed } from '@tko/computed'
import { isObservable, LATEST_VALUE } from '@tko/observable'

export interface ValuePreview {
  kind:
    | 'undefined'
    | 'null'
    | 'primitive'
    | 'function'
    | 'array'
    | 'object'
    | 'observable'
    | 'computed'
    | 'circular'
  type?: string
  value?: string | number | boolean
  name?: string
  length?: number
  constructorName?: string
  keys?: string[]
  current?: ValuePreview
  isPureComputed?: boolean
}

function previewArray(value: unknown[]): ValuePreview {
  return {
    kind: 'array',
    length: value.length
  }
}

function previewObject(value: object): ValuePreview {
  return {
    kind: 'object',
    constructorName: value.constructor?.name,
    keys: Object.keys(value).slice(0, 8)
  }
}

export function previewValue(
  value: unknown,
  depth = 0,
  seen = new Set<unknown>()
): ValuePreview {
  if (value === undefined) {
    return { kind: 'undefined' }
  }

  if (value === null) {
    return { kind: 'null' }
  }

  if (isComputed(value)) {
    return {
      kind: 'computed',
      isPureComputed: isPureComputed(value)
    }
  }

  if (isObservable(value)) {
    return {
      kind: 'observable',
      current: depth > 1 ? undefined : previewValue((value as any)[LATEST_VALUE], depth + 1, seen)
    }
  }

  const valueType = typeof value

  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
    return { kind: 'primitive', type: valueType, value: value as string | number | boolean }
  }

  if (valueType === 'function') {
    return { kind: 'function', name: (value as Function).name || '(anonymous)' }
  }

  if (seen.has(value)) {
    return { kind: 'circular' }
  }

  seen.add(value)

  if (Array.isArray(value)) {
    return previewArray(value)
  }

  return previewObject(value as object)
}
