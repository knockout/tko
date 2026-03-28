/* eslint semi: 0 */

import { options } from '@tko/utils'

import { applyBindings } from '@tko/bind'

import { observable as Observable } from '@tko/observable'

import { DataBindProvider } from '@tko/provider.databind'
import { MultiProvider } from '@tko/provider.multi'
import { VirtualProvider } from '@tko/provider.virtual'

import { bindings as coreBindings } from '@tko/binding.core'

import { bindings as templateBindings } from '@tko/binding.template'

import { bindings as ifBindings } from '@tko/binding.if'

import { TextMustacheProvider } from '../src'
import { expect } from 'chai'
import {
  expectContainHtml,
  expectContainHtmlElementsAndText,
  expectContainText,
  expectNodeTypes,
  prepareTestNode,
  setNodeText
} from './mocha-test-helpers'

describe('Interpolation Markup preprocessor', function () {
  function testPreprocess(node): any {
    const provider = new TextMustacheProvider()
    return provider.preprocessNode(node)
  }

  it('Should do nothing when there are no expressions', function () {
    const result = testPreprocess(document.createTextNode('some text'))
    expect(result).to.equal(null)
  })

  it('Should do nothing when empty', function () {
    const result = testPreprocess(document.createTextNode(''))
    expect(result).to.equal(null)
  })

  it('Should not parse unclosed binding', function () {
    const result = testPreprocess(document.createTextNode('some {{ text'))
    expect(result).to.equal(null)
  })

  it('Should not parse unopened binding', function () {
    const result = testPreprocess(document.createTextNode('some }} text'))
    expect(result).to.equal(null)
  })

  it('Should create binding from {{...}} expression', function () {
    const result = testPreprocess(document.createTextNode('some {{ expr }} text'))
    expectNodeTypes(result, [3, 8, 8, 3])
    expect(result[1].nodeValue).to.equal('ko text:expr')
    expect(result[2].nodeValue).to.equal('/ko')
  })

  it('Should ignore unmatched delimiters', function () {
    const result = testPreprocess(document.createTextNode('some {{ expr }} }} text'))
    expectNodeTypes(result, [3, 8, 8, 3])
    expect(result[1].nodeValue).to.equal('ko text:expr }}')
  })

  it('Should support two expressions', function () {
    const result = testPreprocess(document.createTextNode('some {{ expr1 }} middle {{ expr2 }} text'))
    expectNodeTypes(result, [3, 8, 8, 3, 8, 8, 3])
    expect(result[1].nodeValue).to.equal('ko text:expr1')
    expect(result[4].nodeValue).to.equal('ko text:expr2')
  })

  it('Should skip empty text', function () {
    const result = testPreprocess(document.createTextNode('{{ expr1 }}{{ expr2 }}'))
    expectNodeTypes(result, [8, 8, 8, 8])
    expect(result[0].nodeValue).to.equal('ko text:expr1')
    expect(result[2].nodeValue).to.equal('ko text:expr2')
  })

  it('Should support more than two expressions', function () {
    const result = testPreprocess(document.createTextNode('x {{ expr1 }} y {{ expr2 }} z {{ expr3 }}'))
    expectNodeTypes(result, [3, 8, 8, 3, 8, 8, 3, 8, 8])
    expect(result[1].nodeValue).to.equal('ko text:expr1')
    expect(result[4].nodeValue).to.equal('ko text:expr2')
    expect(result[7].nodeValue).to.equal('ko text:expr3')
  })

  describe('Using unescaped HTML syntax', function () {
    it('Should not parse unclosed binding', function () {
      const result = testPreprocess(document.createTextNode('some {{{ text'))
      expect(result).to.equal(null)
    })

    it('Should not parse unopened binding', function () {
      const result = testPreprocess(document.createTextNode('some }}} text'))
      expect(result).to.equal(null)
    })

    it('Should create binding from {{{...}}} expression', function () {
      const result = testPreprocess(document.createTextNode('some {{{ expr }}} text'))
      expectNodeTypes(result, [3, 8, 8, 3])
      expect(result[1].nodeValue).to.equal('ko html:expr')
      expect(result[2].nodeValue).to.equal('/ko')
    })

    it('Should ignore unmatched delimiters', function () {
      const result = testPreprocess(document.createTextNode('some {{{ expr }}} }}} text'))
      expectNodeTypes(result, [3, 8, 8, 3])
      expect(result[1].nodeValue).to.equal('ko html:expr }}}')
    })

    it('Should support two expressions', function () {
      const result = testPreprocess(document.createTextNode('some {{{ expr1 }}} middle {{{ expr2 }}} text'))
      expectNodeTypes(result, [3, 8, 8, 3, 8, 8, 3])
      expect(result[1].nodeValue).to.equal('ko html:expr1')
      expect(result[4].nodeValue).to.equal('ko html:expr2')
    })
  })

  describe('Using block syntax', function () {
    it('Should create binding from {{#....}}{{/....}} expression', function () {
      const result = testPreprocess(document.createTextNode('some {{#binding:value}}{{/binding}} text'))
      expectNodeTypes(result, [3, 8, 8, 3])
      expect(result[1].nodeValue).to.equal('ko binding:value')
      expect(result[2].nodeValue).to.equal('/ko')
    })

    it('Should tolerate spaces around expressions from {{ #.... }}{{ /.... }} expression', function () {
      const result = testPreprocess(document.createTextNode('some {{ #binding:value }}{{ /binding }} text'))
      expectNodeTypes(result, [3, 8, 8, 3])
      expect(result[1].nodeValue).to.equal('ko binding:value')
      expect(result[2].nodeValue).to.equal('/ko')
    })

    it('Should tolerate spaces around various components', function () {
      const result = testPreprocess(document.createTextNode('some {{# binding : value }}{{/ binding }} text'))
      expectNodeTypes(result, [3, 8, 8, 3])
      expect(result[1].nodeValue).to.equal('ko  binding : value')
      expect(result[2].nodeValue).to.equal('/ko')
    })

    it('Should insert semicolon if missing', function () {
      const result = testPreprocess(document.createTextNode('some {{#binding value}}{{/binding}} text'))
      expectNodeTypes(result, [3, 8, 8, 3])
      expect(result[1].nodeValue).to.equal('ko binding:value')
    })

    it('Should not insert semicolon if binding has no value', function () {
      const result = testPreprocess(document.createTextNode('some {{#binding}}{{/binding}} text'))
      expectNodeTypes(result, [3, 8, 8, 3])
      expect(result[1].nodeValue).to.equal('ko binding')
    })

    it('Should support self-closing syntax', function () {
      const result = testPreprocess(document.createTextNode('some {{#binding:value/}} text'))
      expectNodeTypes(result, [3, 8, 8, 3])
      expect(result[1].nodeValue).to.equal('ko binding:value')
      expect(result[2].nodeValue).to.equal('/ko')
    })

    it('Should tolerate space around self-closing syntax', function () {
      const result = testPreprocess(document.createTextNode('some {{ # binding:value / }} text'))
      expectNodeTypes(result, [3, 8, 8, 3])
      expect(result[1].nodeValue).to.equal('ko  binding:value ')
      expect(result[2].nodeValue).to.equal('/ko')
    })
  })
})

describe('Interpolation Markup bindings', function () {
  let bindingHandlers

  let testNode: HTMLElement
  beforeEach(function () {
    testNode = prepareTestNode()
  })

  beforeEach(function () {
    const provider = new MultiProvider({
      providers: [new TextMustacheProvider(), new DataBindProvider(), new VirtualProvider()]
    })
    options.bindingProviderInstance = provider
    bindingHandlers = provider.bindingHandlers
    bindingHandlers.set(coreBindings)
    bindingHandlers.set(templateBindings)
    bindingHandlers.set(ifBindings)
  })

  it('Should replace {{...}} expression with virtual text binding', function () {
    setNodeText(testNode, "hello {{'name'}}!")
    applyBindings(null, testNode)
    expectContainText(testNode, 'hello name!')
    expectContainHtml(testNode, "hello <!--ko text:'name'-->name<!--/ko-->!")
  })

  it('Should replace multiple expressions', function () {
    setNodeText(testNode, "hello {{'name'}}{{'!'}}")
    applyBindings(null, testNode)
    expectContainText(testNode, 'hello name!')
  })

  it.skip('Should support lambdas (=>) and {{}}', function () {
    // See NOTE on lambda support in the HTML binding, below
    setNodeText(testNode, "hello {{ => '{{name}}' }}!")
    applyBindings(null, testNode)
    expectContainText(testNode, 'hello {{name}}!')
  })

  it('Should ignore unmatched }} and {{', function () {
    setNodeText(testNode, "hello }}'name'{{'!'}}{{")
    applyBindings(null, testNode)
    expectContainText(testNode, "hello }}'name'!{{")
  })

  it('Should update when observable changes', function () {
    setNodeText(testNode, 'The best {{what}}.')
    const observable = Observable('time')
    applyBindings({ what: observable }, testNode)
    expectContainText(testNode, 'The best time.')
    observable('fun')
    expectContainText(testNode, 'The best fun.')
  })

  it.skip('Should be able to override wrapExpression to define a different set of elements', function () {
    // Skipping this because it's neither documented nor does it appear
    // essential to the desired functionality.
    //
    // The functionality has moved off to the mustacheParser's Expression
    // `textNodeReplacement` function, which - if inclined - could be placed
    // back into the TextMustacheProvider.
    /* var originalWrapExpresssion = interpolationMarkup.wrapExpression;
    this.after(function () {
      interpolationMarkup.wrapExpression = originalWrapExpresssion;
    });

    interpolationMarkup.wrapExpression = function (expressionText, node) {
      return originalWrapExpresssion('"--" + ' + expressionText + ' + "--"', node);
    }

    setNodeText(testNode, "hello {{'name'}}!");
    applyBindings(null, testNode);
    expectContainText(testNode, 'hello --name--!'); */
  })

  it('Should not modify the content of <textarea> tags', function () {
    testNode.innerHTML = "<p>Hello</p><textarea>{{'name'}}</textarea><p>Goodbye</p>"
    applyBindings(null, testNode)
    expectContainHtml(testNode, "<p>hello</p><textarea>{{'name'}}</textarea><p>goodbye</p>")
  })

  it('Should not modify the content of <script> tags', function () {
    testNode.innerHTML = '<p>Hello</p><script>{{return}}</script><p>Goodbye</p>'
    applyBindings(null, testNode)
    expectContainHtml(testNode, '<p>hello</p><script>{{return}}</script><p>goodbye</p>')
  })

  it('Should work when used in template declared using <script>', function () {
    testNode.innerHTML =
      "<div data-bind='template: \"tmpl\"'></div><script type='text/html' id='tmpl'>{{'name'}}</script>"
    applyBindings(null, testNode)
    expectContainText(testNode.childNodes[0] as Node, 'name')
  })

  it('Should work when used in template declared using <textarea>', function () {
    testNode.innerHTML = "<div data-bind='template: \"tmpl\"'></div><textarea id='tmpl'>{{'name'}}</textarea>"
    applyBindings(null, testNode)
    expectContainText(testNode.childNodes[0] as Node, 'name')
  })

  describe('Using unescaped HTML syntax', function () {
    //jQuery-Templates (jquery.html(..)) doesn't works with mustache-templates
    if (!options.useTemplateTag && options.jQuery) {
      console.log('Skip some mustache-tests in combination with jquery-template')
      return
    }

    it('Should replace {{{...}}} expression with virtual html binding', function () {
      setNodeText(testNode, "hello {{{'<b>name</b>'}}}!")
      applyBindings(null, testNode)
      expectContainText(testNode, 'hello name!')
      expectContainHtml(testNode, "hello <!--ko html:'<b>name</b>'--><b>name</b><!--/ko-->!")
      expect(testNode.childNodes[2].nodeName.toLowerCase()).to.equal('b')
    })

    it('Should support mix of escaped and unescape expressions', function () {
      setNodeText(testNode, "hello {{{'<b>name</b>'}}}{{'!'}}")
      applyBindings(null, testNode)
      expectContainText(testNode, 'hello name!')
      expectContainHtml(
        testNode,
        "hello <!--ko html:'<b>name</b>'--><b>name</b><!--/ko--><!--ko text:'!'-->!<!--/ko-->"
      )
      expect(testNode.childNodes[2].nodeName.toLowerCase()).to.equal('b')
    })

    it.skip('Should support backticks and {{{}}}', function () {
      // NOTE This was from ko.punches tests, namely when including
      // anonymous function(){}'s, but it's not clear what might be
      // analogous in tko.
      //
      // Two dynamics similar to anonymous functions would be backtick
      // interpolation, and lambdas.
      setNodeText(testNode, "hello {{{ `<b>${'{{{name}}}'}</b>` }}}!")
      applyBindings({ name: 'nAmE' }, testNode)
      expectContainText(testNode, 'hello {{{name}}}!')
      expect(testNode.childNodes[2].nodeName.toLowerCase()).to.equal('b')
    })

    it('Should ignore unmatched }}} and {{{', function () {
      setNodeText(testNode, "hello }}}'name'{{{'!'}}}{{{")
      applyBindings(null, testNode)
      expectContainText(testNode, "hello }}}'name'!{{{")
    })

    it('Should update when observable changes', function () {
      setNodeText(testNode, 'The best {{{what}}}.')
      const observable = Observable('<b>time</b>')
      applyBindings({ what: observable }, testNode)
      expectContainText(testNode, 'The best time.')
      expect(testNode.childNodes[2].nodeName.toLowerCase()).to.equal('b')
      observable('<i>fun</i>')
      expectContainText(testNode, 'The best fun.')
      expect(testNode.childNodes[2].nodeName.toLowerCase()).to.equal('i')
    })
  })

  describe('Using block syntax', function () {
    it('Should support "with"', function () {
      //jQuery-Templates (jquery.html(..)) doesn't works with mustache-templates
      if (!options.useTemplateTag && options.jQuery) {
        console.log('Skip some mustache-tests in combination with jquery-template')
        return
      }

      testNode.innerHTML =
        '<div><h1>{{title}}</h1>{{#with: story}}<div>{{{intro}}}</div><div>{{{body}}}</div>{{/with}}</div>'
      applyBindings({ title: 'First Post', story: { intro: 'Before the jump', body: 'After the jump' } }, testNode)
      expectContainHtmlElementsAndText(
        testNode,
        '<div><h1>first post</h1><div>before the jump</div><div>after the jump</div></div>'
      )
    })

    it('Should support "foreach"', function () {
      testNode.innerHTML = '<ul>{{#foreach: people}}<li>{{$data}}</li>{{/foreach}}</ul>'
      applyBindings({ people: ['Bill Gates', 'Steve Jobs', 'Larry Ellison'] }, testNode)
      expectContainHtmlElementsAndText(
        testNode,
        '<ul><li>bill gates</li><li>steve jobs</li><li>larry ellison</li></ul>'
      )
    })

    it('Should support nested blocks', function () {
      testNode.innerHTML = '<ul>{{#foreach: people}} {{#if: $data}}<li>{{$data}}</li>{{/if}}{{/foreach}}</ul>'
      applyBindings({ people: ['Bill Gates', null, 'Steve Jobs', 'Larry Ellison'] }, testNode)
      expectContainHtmlElementsAndText(
        testNode,
        '<ul><li>bill gates</li><li>steve jobs</li><li>larry ellison</li></ul>'
      )
    })

    it('Should work without the colon', function () {
      testNode.innerHTML = '<ul>{{#foreach people}}<li>{{$data}}</li>{{/foreach}}</ul>'
      applyBindings({ people: ['Bill Gates', 'Steve Jobs', 'Larry Ellison'] }, testNode)
      expectContainHtmlElementsAndText(
        testNode,
        '<ul><li>bill gates</li><li>steve jobs</li><li>larry ellison</li></ul>'
      )
    })

    it('Should support self-closing blocks', function () {
      setNodeText(testNode, "hello {{#text 'name'/}}")
      applyBindings(null, testNode)
      expectContainText(testNode, 'hello name')
    })
  })
})
