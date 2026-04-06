import { contextFor, dataFor } from '@tko/bind'

import type { BindingContext } from '@tko/bind'

import { previewValue, ValuePreview } from './preview'

const contextMetaKeys = new Set([
  'ko',
  '$data',
  '$rawData',
  '$parent',
  '$parents',
  '$root',
  '$index',
  '$parentContext',
  '$component'
])

export interface BindingContextInspection {
  aliasKeys: string[]
  aliases: Record<string, ValuePreview>
  parentsCount: number
  root: ValuePreview
  data: ValuePreview
  rawData: ValuePreview
  chain: ValuePreview[]
}

export interface NodeInspection {
  bound: boolean
  nodeType: number
  nodeName: string
  tagName?: string
  textPreview: string
  data?: ValuePreview
  context?: BindingContextInspection
}

function inspectContext(context: BindingContext): BindingContextInspection {
  const aliases: Record<string, ValuePreview> = {}
  const aliasKeys = Object.keys(context).filter(key => !contextMetaKeys.has(key))

  for (const key of aliasKeys) {
    aliases[key] = previewValue((context as any)[key])
  }

  const chain: ValuePreview[] = []
  let currentContext: BindingContext | undefined = context
  while (currentContext) {
    chain.push(previewValue(currentContext.$data))
    currentContext = currentContext.$parentContext
  }

  return {
    aliasKeys,
    aliases,
    parentsCount: context.$parents?.length ?? 0,
    root: previewValue(context.$root),
    data: previewValue(context.$data),
    rawData: previewValue(context.$rawData),
    chain
  }
}

function previewText(node: Node) {
  const text = node.textContent ?? ''
  return text.length > 80 ? `${text.slice(0, 77)}...` : text
}

export function inspectNode(node: Node): NodeInspection {
  const context = contextFor(node)

  return {
    bound: Boolean(context),
    nodeType: node.nodeType,
    nodeName: node.nodeName,
    tagName: (node as Element).tagName,
    textPreview: previewText(node),
    data: context ? previewValue(dataFor(node)) : undefined,
    context: context ? inspectContext(context) : undefined
  }
}
