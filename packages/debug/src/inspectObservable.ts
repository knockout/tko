import { isComputed, isPureComputed } from '@tko/computed'
import { isObservable, isSubscribable, LATEST_VALUE } from '@tko/observable'

import { previewValue, ValuePreview } from './preview'

export interface ObservableInspection {
  kind: 'observable' | 'computed' | 'subscribable'
  isComputed: boolean
  isPureComputed: boolean
  isObservable: boolean
  isWritable: boolean
  isActive?: boolean
  subscriptions: Record<string, number>
  dependenciesCount?: number
  dependencies?: ValuePreview[]
  value: ValuePreview
}

export type PathTarget = unknown

export interface PathInspection {
  found: boolean
  path: string[]
  value: ValuePreview
  observable?: ObservableInspection
}

function readCurrentValue(target: any) {
  if (isObservable(target)) {
    return target[LATEST_VALUE]
  }

  return target
}

function listSubscriptions(target: any) {
  const subscriptions: Record<string, number> = {}
  const subscriptionMap = target?._subscriptions ?? {}

  for (const key of Object.keys(subscriptionMap)) {
    subscriptions[key] = subscriptionMap[key]?.length ?? 0
  }

  return subscriptions
}

function normalizePath(path: string | string[]) {
  if (Array.isArray(path)) {
    return path.filter(Boolean)
  }

  return path
    .split('.')
    .map(segment => segment.trim())
    .filter(Boolean)
}

export function inspectObservable(target: unknown): ObservableInspection | undefined {
  if (!isSubscribable(target)) {
    return undefined
  }

  const computed = isComputed(target)
  const pureComputed = isPureComputed(target)

  return {
    kind: computed ? 'computed' : isObservable(target) ? 'observable' : 'subscribable',
    isComputed: computed,
    isPureComputed: pureComputed,
    isObservable: isObservable(target),
    isWritable: Boolean((target as any).isWriteable),
    isActive: computed ? (target as any).isActive() : undefined,
    subscriptions: listSubscriptions(target),
    dependenciesCount: computed ? (target as any).getDependenciesCount() : undefined,
    dependencies: computed
      ? (target as any).getDependencies().map((dependency: unknown) => previewValue(dependency))
      : undefined,
    value: computed ? previewValue(target) : previewValue(readCurrentValue(target))
  }
}

export function inspectPath(source: PathTarget, path: string | string[]): PathInspection {
  const segments = normalizePath(path)
  let current = source

  for (const segment of segments) {
    const container = isObservable(current) ? readCurrentValue(current) : current
    if (container === null || container === undefined) {
      return {
        found: false,
        path: segments,
        value: previewValue(undefined),
        observable: undefined
      }
    }

    const isObjectLike = typeof container === 'object' || typeof container === 'function'
    if (!isObjectLike || !(segment in (container as object))) {
      return {
        found: false,
        path: segments,
        value: previewValue(undefined),
        observable: undefined
      }
    }

    current = (container as any)[segment]
  }

  return {
    found: true,
    path: segments,
    value: previewValue(current),
    observable: inspectObservable(current)
  }
}
