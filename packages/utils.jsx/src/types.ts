
export type JsxNodeAttribute =
  | string
  | (() => string)
  | KnockoutSubscribable<string>

export interface JsxObject {
  elementName: string
  attributes: Record<string, JsxNodeAttribute>
  children: Array<JsxNodeable>
}

export type JsxNodeable =
  | (() => JsxNodeable)
  | { [Symbol.iterator] (): Generator<JsxNodeable> }
  | Array<JsxNodeable>
  | BigInt
  | boolean
  | Error
  | Iterable<JsxNodeable>
  | KnockoutSubscribable<JsxNodeable>
  | KnockoutComputed<JsxNodeable>
  | KnockoutObservable<JsxNodeable>
  | KnockoutObservableArray<JsxNodeable>
  | Node
  | null
  | number
  | Promise<JsxNodeable>
  | string
  | Symbol
  | JsxObject
  | undefined
