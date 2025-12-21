// A template source represents a read/write way of accessing a template. This is to eliminate the need for template loading/saving
// logic to be duplicated in every template engine (and means they can all work with anonymous templates, etc.)
//
// Two are provided by default:
//  1. ko.templateSources.domElement       - reads/writes the text content of an arbitrary DOM element
//  2. ko.templateSources.anonymousElement - uses ko.utils.domData to read/write text *associated* with the DOM element, but
//                                           without reading/writing the actual element text content, since it will be overwritten
//                                           with the rendered template output.
// You can implement your own template source if you want to fetch/store templates somewhere other than in DOM elements.
// Template sources need to have the following functions:
//   text() 			- returns the template text from your storage location
//   text(value)		- writes the supplied template text to your storage location
//   data(key)			- reads values stored using data(key, value) - see below
//   data(key, value)	- associates "value" with this template and the key "key". Is used to store information like "isRewritten".
//
// Optionally, template sources can also have the following functions:
//   nodes()            - returns a DOM element containing the nodes of this template, where available
//   nodes(value)       - writes the given DOM element to your storage location
// If a DOM element is available for a given template source, template engines are encouraged to use it in preference over text()
// for improved speed. However, all templateSources must supply text() even if they don't supply nodes().
//
// Once you've implemented a templateSource, make your template engine use it by subclassing whatever template engine you were
// using and overriding "makeTemplateSource" to return an instance of your custom template source.

import { tagNameLower as tagNameLowerFn, setHtml, domData, parseHtmlForTemplateNodes } from '@tko/utils'

// ---- ko.templateSources.domElement -----

// template types
const templateScript = 1,
  templateTextArea = 2,
  templateTemplate = 3,
  templateElement = 4

export interface TemplateSource {
  //constructor(element: Node);

  text(): string
  text(valueToWrite: string): void

  data(key: string): any
  data<T>(key: string): T
  data<T>(key: string, valueToWrite: T): void

  nodes?: { (): Node; (valueToWrite: Node): void }
}

let dataDomDataPrefix = domData.nextKey() + '_'
let templatesDomDataKey = domData.nextKey()
function getTemplateDomData(element) {
  return domData.get(element, templatesDomDataKey) || {}
}
function setTemplateDomData(element, data) {
  domData.set(element, templatesDomDataKey, data)
}

export class domElement implements TemplateSource {
  domElement: Element
  templateType: number

  constructor(element: Element) {
    this.domElement = element

    let tagNameLower = tagNameLowerFn(element)
    this.templateType =
      tagNameLower === 'script'
        ? templateScript
        : tagNameLower === 'textarea'
          ? templateTextArea
          : // For browsers with proper <template> element support, where the .content property gives a document fragment
            tagNameLower == 'template'
              && (element as HTMLTemplateElement).content
              && (element as HTMLTemplateElement).content.nodeType === 11
            ? templateTemplate
            : templateElement
  }

  text(): string
  text(valueToWrite: string): void
  text(valueToWrite?: string): string | void {
    const elemContentsProperty =
      this.templateType === templateScript ? 'text' : this.templateType === templateTextArea ? 'value' : 'innerHTML'

    if (arguments.length == 0) {
      return this.domElement[elemContentsProperty]
    } else {
      if (elemContentsProperty === 'innerHTML') {
        setHtml(this.domElement, valueToWrite!)
      } else {
        this.domElement[elemContentsProperty] = valueToWrite
      }
    }
  }

  data<T = any>(key: string, valueToWrite?: T): T | void {
    if (arguments.length === 1) {
      return domData.get(this.domElement, dataDomDataPrefix + key)
    } else {
      domData.set(this.domElement, dataDomDataPrefix + key, valueToWrite)
    }
  }

  nodes(): Node
  nodes(valueToWrite: Node): void
  nodes(valueToWrite?: any): Node | void {
    const element = this.domElement
    if (arguments.length == 0) {
      const templateData = getTemplateDomData(element)
      let nodes =
        templateData.containerData
        || (this.templateType === templateTemplate
          ? (element as HTMLTemplateElement).content
          : this.templateType === templateElement
            ? element
            : undefined)
      if (!nodes || templateData.alwaysCheckText) {
        // If the template is associated with an element that stores the template as text,
        // parse and cache the nodes whenever there's new text content available. This allows
        // the user to update the template content by updating the text of template node.
        const text = (this as any)['text']()
        if (text) {
          nodes = parseHtmlForTemplateNodes(text, element.ownerDocument)
          ;(this as any)['text']('') // clear the text from the node
          setTemplateDomData(element, { containerData: nodes, alwaysCheckText: true })
        }
      }

      return nodes
    } else {
      setTemplateDomData(element, { containerData: valueToWrite })
    }
  }
}

// ---- ko.templateSources.anonymousTemplate -----
// Anonymous templates are normally saved/retrieved as DOM nodes through "nodes".
// For compatibility, you can also read "text"; it will be serialized from the nodes on demand.
// Writing to "text" is still supported, but then the template data will not be available as DOM nodes.
export class anonymousTemplate extends domElement {
  constructor(element?: any) {
    super(element)
  }

  override text(): string
  override text(valueToWrite: string): void
  override text(/* valueToWrite */): string | void {
    if (arguments.length == 0) {
      const templateData = getTemplateDomData(this.domElement)
      if (templateData.textData === undefined && templateData.containerData) {
        templateData.textData = templateData.containerData.innerHTML
      }
      return templateData.textData
    } else {
      const valueToWrite = arguments[0]
      setTemplateDomData(this.domElement, { textData: valueToWrite })
    }
  }
}
