/* eslint semi: 0 */

import {
    triggerEvent, options
} from '@tko/utils';

import {
    applyBindings
} from '@tko/bind';

import {
    observable as Observable
} from '@tko/observable';

import {
    bindings as coreBindings
} from '@tko/binding.core';

import {
  MultiProvider
} from '@tko/provider.multi'

import {
  DataBindProvider
} from '@tko/provider.databind'

import {
    AttributeMustacheProvider
} from '../src';

import '@tko/utils/helpers/jasmine-13-helper.js';

function ctxStub (obj = {}) { return { lookup (v) { return obj[v] } } }

describe('Attribute Interpolation Markup Provider', function () {
  var testNode, provider;

  beforeEach(function () {
    provider = new AttributeMustacheProvider()
    options.bindingProviderInstance = provider
    testNode = document.createElement('div');
    provider.bindingHandlers.set(coreBindings);
  });

  function runAttributeInterpolation (testNode) {
    applyBindings({}, testNode)
  }

  it('Should do nothing when there are no expressions', function () {
    testNode.setAttribute('title', 'some text');
    expect(testNode.title).toEqual('some text');
    expect(Object.keys(provider.getBindingAccessors).length).toBe(0)
  });

  it('Should do nothing when empty', function () {
    testNode.setAttribute('title', '');
    runAttributeInterpolation(testNode);
    expect(testNode.title).toEqual('');
    const bindings = provider.getBindingAccessors(testNode)
    expect(Object.keys(bindings).length).toBe(0)
  });

  it('Should not parse unclosed binding', function () {
    testNode.setAttribute('title', 'some {{text');
    runAttributeInterpolation(testNode);
    expect(testNode.title).toEqual('some {{text');
    const bindings = provider.getBindingAccessors(testNode)
    expect(Object.keys(bindings).length).toBe(0)
  });

  it('Should not parse unopened binding', function () {
    testNode.setAttribute('title', 'some}} text');
    runAttributeInterpolation(testNode);
    expect(testNode.title).toEqual('some}} text');
    const bindings = provider.getBindingAccessors(testNode)
    expect(Object.keys(bindings).length).toBe(0)
  });

  it('Should create binding from {{...}} expression', function () {
    testNode.setAttribute('title', 'some {{expr}} text');
    const bindings = Array.from(provider.bindingParts(testNode, {}))
    expect(bindings.length).toBe(1)
    const [handler, parts] = bindings[0]
    expect(handler).toEqual('title')
    expect(parts.length).toBe(3)
    expect(parts[0].text).toEqual('some ')
    expect(parts[1].text).toEqual('expr')
    expect(parts[2].text).toEqual(' text')
  });

  it('Should ignore unmatched delimiters', function () {
    testNode.setAttribute('title', 'some {{expr1}}expr2}} text');
    const bindings = Array.from(provider.bindingParts(testNode, {}))
    expect(bindings.length).toBe(1)
    const [handler, parts] = bindings[0]
    expect(parts.length).toBe(3)
    expect(parts[0].text).toEqual('some ')
    expect(parts[1].text).toEqual('expr1}}expr2')
    expect(parts[2].text).toEqual(' text')
  });

  it('Should support two expressions', function () {
    testNode.setAttribute('title', 'some {{expr1}} middle {{expr2}} text');
    const bindings = Array.from(provider.bindingParts(testNode, {}))
    expect(bindings.length).toBe(1)
    const [handler, parts] = bindings[0]
    expect(parts.length).toBe(5)
    const expected = ['some ', 'expr1', ' middle ', 'expr2', ' text']
    for (let i = 0; i < expected.length; ++i) {
      expect(parts[i].text).toEqual(expected[i])
    }
  });

  it('Should skip empty text', function () {
    testNode.setAttribute('title', '{{expr1}}{{expr2}}');
    const bindings = Array.from(provider.bindingParts(testNode, {}))
    expect(bindings.length).toBe(1)
    const [handler, parts] = bindings[0]
    expect(parts.length).toBe(2)
    const expected = ['expr1', 'expr2']
    for (let i = 0; i < expected.length; ++i) {
      expect(parts[i].text).toEqual(expected[i])
    }
  });

  it('Should support more than two expressions', function () {
    testNode.setAttribute('title', 'x {{expr1}} y {{expr2}} z {{expr3}}');
    const bindings = Array.from(provider.bindingParts(testNode, {}))
    expect(bindings.length).toBe(1)
    const [handler, parts] = bindings[0]
    expect(parts.length).toBe(6)
    const expected = ['x ', 'expr1', ' y ', 'expr2', ' z ', 'expr3']
    for (let i = 0; i < expected.length; ++i) {
      expect(parts[i].text).toEqual(expected[i])
    }
  });

  it('Should create simple binding for single expression', function () {
    testNode.setAttribute('title', '{{expr1}}');
    const bindings = Array.from(provider.bindingParts(testNode, {}))
    expect(bindings.length).toBe(1)
    const [handler, parts] = bindings[0]
    expect(parts.length).toBe(1)
    const expected = ['expr1']
    for (let i = 0; i < expected.length; ++i) {
      expect(parts[i].text).toEqual(expected[i])
    }
  });

  it('Should support expressions in multiple attributes', function () {
    testNode.setAttribute('title', '{{expr1}}');
    testNode.setAttribute('class', 'test');  // skipped b/c not interpolated
    testNode.setAttribute('id', '{{expr2}}');
    testNode.setAttribute('data-test', '{{expr3}}');
    const bindings = Array.from(provider.bindingParts(testNode, {}))
    expect(bindings.length).toBe(3)
    const [p0, p1, p2, p3] = bindings
    const map = { title: 'expr1', id: 'expr2', 'data-test': 'expr3' }
    bindings.forEach(b => {
      const [handler, [part]] = b
      expect(map[handler]).toEqual(part.text)
    })
    expect(testNode.getAttribute('class')).toEqual('test')
  });

  it('Should convert value and checked attributes to two-way bindings', function () {
    var input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('checked', '{{expr2}}')
    input.setAttribute('value', '{{expr1}}')

    const ctx = { expr1: Observable(), expr2: Observable() }
    const bindings = Array.from(
          provider.bindingObjects(testNode, ctxStub(ctx))
        )
    for (const binding of bindings) {
      if (binding.checked) {
        expect(binding.checked).toEqual(ctx.expr2)
      } else if (binding.value) {
        expect(binding.value).toEqual(ctx.expr1)
      } else {
        throw new Error('Unexpected bindings.')
      }
    }
  });

  it('Should support custom attribute binding using "attributeBinding" overloading', function () {
    class KOAttr extends AttributeMustacheProvider {
      attributeBinding (name, value) {
        const parsedName = name.match(/^ko-(.*)$/)
        if (parsedName) {
          return super.attributeBinding(parsedName[1], value)
        }
        return super.attributeBinding(name, value)
      }
      }

    const provider = new KOAttr()

      // Won't be in data-bind because it doesn't include an expression
    testNode.setAttribute('ko-class', 'test')
      // Should handle normal attributes normally
    testNode.setAttribute('title', '{{expr1}}')
      // This will use the custom handler
    testNode.setAttribute('ko-id', '{{expr2}}')

    const ctx = {expr1: 'x', expr2: 'y'}
    const bindings = provider.getBindingAccessors(testNode, ctxStub(ctx))

    expect(Object.keys(bindings).length).toEqual(2)
    expect(bindings['attr.title']().title).toEqual('x')
    expect(bindings['attr.id']().id).toEqual('y')

      // expect(testNode.getAttribute('data-bind')).toEqual('attr.title:expr1,attr.id:expr2')
  });

  it('should set the style attribute (when there is a `style` binding)', function () {
    var obs = Observable()
    testNode.innerHTML = '<div style="color: {{ obs }}"></div>'
    var div = testNode.childNodes[0]
    applyBindings({obs: obs}, testNode)
    expect(div.getAttribute('style')).toEqual('color: ')
    obs('red')
    expect(div.getAttribute('style')).toEqual('color: red')
  })
});

describe('Attribute Interpolation Markup bindings', function () {
  beforeEach(jasmine.prepareTestNode);

  var bindingHandlers;

  beforeEach(function () {
    const providers = [
      new AttributeMustacheProvider(),
      new DataBindProvider()
    ]
    const provider = new MultiProvider({providers})
    options.bindingProviderInstance = provider
    bindingHandlers = provider.bindingHandlers
    bindingHandlers.set(coreBindings)
  });

  it('Should replace {{...}} expression in attribute', function () {
    testNode.innerHTML = "<div title='hello {{\"name\"}}!'></div>";
    applyBindings(null, testNode);
    expect(testNode.childNodes[0].title).toEqual('hello name!');
  });

  it('Should replace multiple expressions', function () {
    testNode.innerHTML = "<div title='hello {{\"name\"}}{{\"!\"}}'></div>";
    applyBindings(null, testNode);
    expect(testNode.childNodes[0].title).toEqual('hello name!');
  });

  it('Should support backtick interpolation', function () {
    testNode.innerHTML = "<div title='hello {{ `a${name}b` }}!'></div>";
    applyBindings({ name: 'n' }, testNode);
    expect(testNode.childNodes[0].title).toEqual('hello anb!');
  });

  it('Should properly handle quotes in text sections', function () {
    testNode.innerHTML = "<div title='This is \"great\" {{\"fun\"}} with &apos;friends&apos;'></div>";
    applyBindings(null, testNode);
    expect(testNode.childNodes[0].title).toEqual("This is \"great\" fun with 'friends'");
  });

  it('Should ignore unmatched }} and {{', function () {
    testNode.innerHTML = "<div title='hello }}\"name\"{{\"!\"}}{{'></div>";
    applyBindings(null, testNode);
    expect(testNode.childNodes[0].title).toEqual('hello }}"name"!{{');
  });

  it('Should support expressions in multiple attributes', function () {
    testNode.innerHTML = "<div title='{{title}}' id='{{id}}' class='test class' data-test='hello {{\"name\"}}!' data-bind='text:content'></div>";
    applyBindings({title: 'the title', id: 'test id', content: 'content'}, testNode);
    expect(testNode).toContainText('content');
    expect(testNode.childNodes[0].title).toEqual('the title');
    expect(testNode.childNodes[0].id).toEqual('test id');
    expect(testNode.childNodes[0].className).toEqual('test class');
    expect(testNode.childNodes[0].getAttribute('data-test')).toEqual('hello name!');
  });

  it('Should update when observable changes', function () {
    testNode.innerHTML = "<div title='The best {{what}}.'></div>";
    var observable = Observable('time');
    applyBindings({what: observable}, testNode);
    expect(testNode.childNodes[0].title).toEqual('The best time.');
    observable('fun');
    expect(testNode.childNodes[0].title).toEqual('The best fun.');
  });

  it('Should convert value attribute to two-way binding', function () {
    testNode.innerHTML = "<input value='{{value}}'/>";
    var observable = Observable('default value');
    applyBindings({value: observable}, testNode);
    expect(testNode.childNodes[0].value).toEqual('default value');

    testNode.childNodes[0].value = 'user-enterd value';
    triggerEvent(testNode.childNodes[0], 'change');
    expect(observable()).toEqual('user-enterd value');
  });

  it('Should convert checked attribute to two-way binding', function () {
    testNode.innerHTML = "<input type='checkbox' checked='{{isChecked}}'/>";
    var observable = Observable(true);
    applyBindings({isChecked: observable}, testNode);
    expect(testNode.childNodes[0].checked).toBe(true);

    testNode.childNodes[0].click();
    expect(observable()).toBe(false);
  });
});
