import { Parser } from '@tko/utils.parser'

const INNER_EXPRESSION = /^([\s\S]*)}}([\s\S]*?)\{\{([\s\S]*)$/
const OUTER_EXPRESSION = /^([\s\S]*?)\{\{([\s\S]*)}}([\s\S]*)$/
const BINDING_EXPRESSION = /^([^,"'{}()/:[\]\s]+)\s+([^\s:].*)/

class Interpolated {
  text: string
  constructor(text: string) {
    this.text = text
  }

  trim(string) {
    return string === null ? '' : string.trim()
  }
}

class Expression extends Interpolated {
  asAttr(context, globals, node) {
    return new Parser().parseExpression(this.text, context, globals, node)()
  }

  *textNodeReplacement(textNode) {
    const text = this.trim(this.text)
    const ownerDocument = textNode ? textNode.ownerDocument : document
    const firstChar = text[0]
    const lastChar = text[text.length - 1]
    let closeComment = true
    let binding

    if (firstChar === '#') {
      if (lastChar === '/') {
        binding = text.slice(1, -1)
      } else {
        binding = text.slice(1)
        closeComment = false
      }
      const matches = binding.match(BINDING_EXPRESSION)
      if (matches) {
        binding = matches[1] + ':' + matches[2]
      }
    } else if (firstChar === '/') {
      // replace only with a closing comment
    } else if (firstChar === '{' && lastChar === '}') {
      binding = 'html:' + this.trim(text.slice(1, -1))
    } else {
      binding = 'text:' + this.trim(text)
    }

    if (binding) {
      yield ownerDocument.createComment('ko ' + binding)
    }
    if (closeComment) {
      yield ownerDocument.createComment('/ko')
    }
  }
}

class Text extends Interpolated {
  asAttr(): string {
    return this.text
  }

  *textNodeReplacement() {
    yield document.createTextNode(this.text.replace(/"/g, '\\"'))
  }
}

/**
 *          Interpolation Parsing
 */
export function* innerParse(text: string) {
  const innerMatch = text.match(INNER_EXPRESSION)
  if (innerMatch) {
    const [pre, inner, post] = innerMatch.slice(1)
    yield* innerParse(pre)
    yield new Text(inner)
    yield new Expression(post)
  } else {
    yield new Expression(text)
  }
}

export function* parseOuterMatch(outerMatch?: RegExpMatchArray | null) {
  if (!outerMatch) {
    return
  }
  const [pre, inner, post] = outerMatch.slice(1)
  yield new Text(pre)
  yield* innerParse(inner)
  yield new Text(post)
}

export function* parseInterpolation(text: string | null) {
  for (const textOrExpr of parseOuterMatch(text?.match(OUTER_EXPRESSION))) {
    if (textOrExpr.text) {
      yield textOrExpr
    }
  }
}
