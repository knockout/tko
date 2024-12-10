import operators from './operators'

export {default as Parser} from './Parser'
export {default as Identifier} from './Identifier'
export {default as Arguments} from './Arguments'
export {default as Ternary} from './Ternary'
export {default as Node} from './Node'

export {default as parseObjectLiteral} from './preparse'


export function overloadOperator (op: string, fn: (a, b) => any, precedence?: number) {
  operators[op] = fn
  if (Number.isInteger(precedence)) {
    operators[op].precedence = precedence
  }
}
