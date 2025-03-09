
import {
  setElementName, objectForEach
} from '@tko/utils'

import {
  unwrap
} from '@tko/observable'

import type { AllBindings } from '@tko/bind'

export var attr = {
  update: function (element, valueAccessor, allBindings: AllBindings) { // allBindings not used!
    var value = unwrap(valueAccessor()) || {}
    objectForEach(value, function (attrName, attrValue) {
      attrValue = unwrap(attrValue)

      // Find the namespace of this attribute, if any.
      var prefixLen = attrName.indexOf(':')
      var namespace = prefixLen > 0 && element.lookupNamespaceURI(attrName.substr(0, prefixLen))

      // To cover cases like "attr: { checked:someProp }", we want to remove the attribute entirely
      // when someProp is a "no value"-like value (strictly null, false, or undefined)
      // (because the absence of the "checked" attr is how to mark an element as not checked, etc.)
      const toRemove = attrValue === false || attrValue === null || attrValue === undefined

      if (toRemove) {
        if (namespace) {
          element.removeAttributeNS(namespace, attrName)
        } else {
          element.removeAttribute(attrName)
        }
      } else {
        attrValue = attrValue.toString()
        if (namespace) {
          element.setAttributeNS(namespace, attrName, attrValue)
        } else {
          element.setAttribute(attrName, attrValue)
        }
      }

      // Treat "name" specially - although you can think of it as an attribute, it also needs
      // special handling on older versions of IE (https://github.com/SteveSanderson/knockout/pull/333)
      // Deliberately being case-sensitive here because XHTML would regard "Name" as a different thing
      // entirely, and there's no strong reason to allow for such casing in HTML.
      if (attrName === 'name') {
        setElementName(element, toRemove ? '' : attrValue)
      }
    })
  }
}
