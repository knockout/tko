//
// Helpers
// ---
// toJS & toJSON
//

import { isObservable } from './observable'

var maxNestedObservableDepth: number = 10 // Escape the (unlikely) pathological case where an observable's current value is itself (or similar reference cycle)

export function toJS<T = any>(rootObject: T): T {
  if (arguments.length == 0) {
    throw new Error('When calling ko.toJS, pass the object you want to convert.');
  }

    // We just unwrap everything at every level in the object graph
  return mapJsObjectGraph(rootObject, function (valueToMap: any) {
        // Loop because an observable's value might in turn be another observable wrapper
    for (var i = 0; isObservable(valueToMap) && (i < maxNestedObservableDepth); i++) { valueToMap = valueToMap() }
    return valueToMap
  })
}

export function toJSON<T = any>(rootObject: T, replacer?: (key: string, value: any) => any, space?: string | number): string {     // replacer and space are optional
  var plainJavaScriptObject = toJS(rootObject)
  return JSON.stringify(plainJavaScriptObject, replacer, space)
}

function mapJsObjectGraph<T = any>(rootObject: T, mapInputCallback: (value: any) => any, visitedObjects = new Map()): any {
  rootObject = mapInputCallback(rootObject)
  var canHaveProperties = (typeof rootObject === 'object') && (rootObject !== null) && (rootObject !== undefined) && (!(rootObject instanceof RegExp)) && (!(rootObject instanceof Date)) && (!(rootObject instanceof String)) && (!(rootObject instanceof Number)) && (!(rootObject instanceof Boolean))
  if (!canHaveProperties) {
    return rootObject;
  }

  var outputProperties: any = rootObject instanceof Array ? [] : {}
  visitedObjects.set(rootObject, outputProperties)

  visitPropertiesOrArrayEntries(rootObject, function (indexer: any) {
    var propertyValue = mapInputCallback(rootObject[indexer])

    switch (typeof propertyValue) {
      case 'boolean':
      case 'number':
      case 'string':
      case 'function':
        outputProperties[indexer] = propertyValue
        break
      case 'object':
      case 'undefined':
        var previouslyMappedValue = visitedObjects.get(propertyValue)
        outputProperties[indexer] = (previouslyMappedValue !== undefined)
                ? previouslyMappedValue
                : mapJsObjectGraph(propertyValue, mapInputCallback, visitedObjects)
        break
    }
  })

  return outputProperties
}

function visitPropertiesOrArrayEntries<T = any>(rootObject: T, visitorCallback: (indexer: any) => void): void {
  if (rootObject instanceof Array) {
    for (var i = 0; i < rootObject.length; i++) {
      visitorCallback(i)
    }

        // For arrays, also respect toJSON property for custom mappings (fixes #278)
  if (typeof rootObject['toJSON'] === 'function') { visitorCallback('toJSON') }
  } else {
    for (var propertyName in rootObject) {
      visitorCallback(propertyName)
    }
  }
}
