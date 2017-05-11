
import {
  Parser
} from 'tko.utils.parser'

const INNER_EXPRESSION = /^([\s\S]*)}}([\s\S]*?)\{\{([\s\S]*)$/
const OUTER_EXPRESSION = /^([\s\S]*?)\{\{([\s\S]*)}}([\s\S]*)$/

class Interpolated {
  constructor (text) {
    this.text = text
  }
}

class Expression extends Interpolated {
  asPart () { return this.text }
  asAttr (context, globals) {
    return new Parser().parseExpression(this.text, context, globals)()
  }
}

class Text extends Interpolated {
  asPart () { return this.text.replace(/"/g, '\\"') }
  asAttr () { return this.text }
}

/**
 *          Interpolation Parsing
 */
export function * innerParse (text) {
  const innerMatch = text.match(INNER_EXPRESSION)
  if (innerMatch) {
    const [pre, inner, post] = innerMatch.slice(1)
    yield * innerParse(pre)
    yield new Text(inner)
    yield new Expression(post)
  } else {
    yield new Expression(text)
  }
}

export function * parseOuterMatch (outerMatch) {
  if (!outerMatch) { return }
  let [pre, inner, post] = outerMatch.slice(1)
  yield new Text(pre)
  yield * innerParse(inner)
  yield new Text(post)
}

export function * parseInterpolation (text) {
  for (const textOrExpr of parseOuterMatch(text.match(OUTER_EXPRESSION))) {
    if (textOrExpr.text) { yield textOrExpr }
  }
}
