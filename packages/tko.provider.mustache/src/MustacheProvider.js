
import {
  Provider
} from 'tko.provider'

export default class MustacheProvider extends Provider {
  get DATABIND_ATTRIBUTE () { return 'data-bind' }
  get INNER_EXPRESSION () { return /^([\s\S]*)}}([\s\S]*?)\{\{([\s\S]*)$/ }
  get OUTER_EXPRESSION () { return /^([\s\S]*?)\{\{([\s\S]*)}}([\s\S]*)$/ }

  /**
   *          Interpolation Parsing
   */
  * innerParse (text) {
    var innerMatch = text.match(this.INNER_EXPRESSION)
    if (innerMatch) {
      yield * this.innerParse(innerMatch[1])
      yield [ 'text', innerMatch[2] ]
      yield [ 'expression', innerMatch[3] ]
    } else {
      yield [ 'expression', text ]
    }
  }

  * parseInterpolation (text) {
    const outerMatch = text.match(this.OUTER_EXPRESSION)
    if (outerMatch) {
      yield [ 'text', outerMatch[1] ]
      yield * this.innerParse(outerMatch[2])
      yield [ 'text', outerMatch[3] ]
    }
  }

  /**
   *      Text Interpolation
   */

  * wrapExpression (text, textNode) {
    text = (text || '').trim()
    const ownerDocument = textNode ? textNode.ownerDocument : document
    const firstChar = text[0]
    const lastChar = text[text.length - 1]
    var closeComment = true
    var binding

    if (firstChar === '#') {
      if (lastChar === '/') {
        binding = text.slice(1, -1)
      } else {
        binding = text.slice(1)
        closeComment = false
      }
      const matches = binding.match(/^([^,"'{}()/:[\]\s]+)\s+([^\s:].*)/)
      if (matches) {
        binding = matches[1] + ':' + matches[2]
      }
    } else if (firstChar === '/') {
      // replace only with a closing comment
    } else if (firstChar === '{' && lastChar === '}') {
      binding = 'html:' + text.slice(1, -1).trim()
    } else {
      binding = 'text:' + text.trim()
    }

    if (binding) {
      yield ownerDocument.createComment('ko ' + binding)
    }
    if (closeComment) {
      yield ownerDocument.createComment('/ko')
    }
  }

  * textToNodes (textNode) {
    const parent = textNode.parentNode
    const isTextarea = parent && parent.nodeName === 'TEXTAREA'
    const hasStash = textNode.nodeValue && textNode.nodeValue.includes('{{')

    if (!hasStash || isTextarea) { return }

    for (const [type, value] of this.parseInterpolation(textNode.nodeValue)) {
      if (type === 'text') {
        yield document.createTextNode(value)
      } else {
        yield * this.wrapExpression(value, textNode)
      }
    }
  }

  textInterpolation (textNode) {
    const newNodes = Array.from(this.textToNodes(textNode))

    if (newNodes.length === 0) { return }

    if (textNode.parentNode) {
      const parent = textNode.parentNode
      const n = newNodes.length
      for (let i = 0; i < n; ++i) {
        parent.insertBefore(newNodes[i], textNode)
      }
      parent.removeChild(textNode)
    }

    return newNodes
  }

  /**
   *       Attribute Interpolation
   */
  * partsOfAttribute (attr) {
    for (const [type, value] of this.parseInterpolation(attr.value)) {
      if (!value) { continue }
      if (type === 'text') {
        yield ['text', value.replace(/"/g, '\\"')]
      } else {
        yield [type, value]
      }
    }
  }

  * attributesToInterpolate (attributes) {
    for (const attr of attributes) {
      const isDatabind = attr.name === this.DATABIND_ATTRIBUTE
      if (attr.specified && !isDatabind && attr.value.includes('{{')) {
        yield attr
      }
    }
  }

  attributePartsToValue (parts) {
    return parts.map(p => {
      const [type, value] = p
      return type === 'text' ? `"${value}"` : `@(${value})`
    })
  }

  attributeInterpolation (element) {
    if (element.attributes.length === 0) { return }
    const dataBindValues = [element.getAttribute(this.DATABIND_ATTRIBUTE)]

    const attributeList = Array.from(element.attributes)

    for (const attr of this.attributesToInterpolate(attributeList)) {
      const parts = Array.from(this.partsOfAttribute(attr))
      if (!parts.length) { continue }
      const dBvalue = parts.length > 1
        ? ['""', ...this.attributePartsToValue(parts)].join('+')
        : parts[0][1]
      dataBindValues.push(this.attributeBinding(attr.name, dBvalue))
      element.removeAttribute(attr.name)
    }

    if (dataBindValues.length > 1) {
      const newDataBind = dataBindValues.filter(v => v).join(',')
      element.setAttribute(this.DATABIND_ATTRIBUTE, newDataBind)
    }
  }

  attributeBinding (name, value) {
    const hasBinding = this.bindingHandlers.get(name)
    return hasBinding ? name + ':' + value : 'attr.' + name + ':' + value
  }

  preprocessNode (node) {
    switch (node.nodeType) {
      case 3:
        // Text Node
        return this.textInterpolation(node)
      case 1:
        // <node>
        return this.attributeInterpolation(node)
    }
  }
}
