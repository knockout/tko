describe('Binding: Attr', function () {
  beforeEach(prepareTestNode)

  it('Should be able to set arbitrary attribute values', function () {
    var model = { myValue: 'first value' }
    testNode.innerHTML = '<div data-bind=\'attr: {firstAttribute: myValue, "second-attribute": true}\'></div>'
    ko.applyBindings(model, testNode)
    expect(testNode.childNodes[0].getAttribute('firstAttribute')).to.deep.equal('first value')
    expect(testNode.childNodes[0].getAttribute('second-attribute')).to.deep.equal('true')
  })

  it('Should be able to set namespaced attribute values', function (ctx) {
    if (!isRealBrowser()) return ctx.skip('happy-dom: Element.lookupNamespaceURI not implemented')
    var model = { myValue: 'first value' }
    testNode.innerHTML = [
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
      '<g>',
      '<a data-bind="attr: { \'xlink:href\': myValue }">',
      '<text>foo</text>',
      '</a>',
      '</g>',
      '</svg>'
    ].join('')

    ko.applyBindings(model, testNode)

    var anchor = testNode.childNodes[0] /*svg*/.childNodes[0] /*g*/.childNodes[0] /*a*/
    if (anchor && 'getAttributeNode' in anchor) {
      var anchorAttribute = anchor.getAttributeNode('xlink:href')
      expect(anchorAttribute.value).to.deep.equal('first value')
      if (anchorAttribute.namespaceURI) {
        expect(anchorAttribute.namespaceURI).to.deep.equal('http://www.w3.org/1999/xlink')
      }
    }
  })

  it('Should be able to set \"name\" attribute, even on IE6-7', function () {
    var myValue = ko.observable('myName')
    testNode.innerHTML = "<input data-bind='attr: { name: myValue }' />"
    ko.applyBindings({ myValue: myValue }, testNode)
    expect(testNode.childNodes[0].name).to.deep.equal('myName')
    if (testNode.childNodes[0].outerHTML) {
      // Old Firefox doesn't support outerHTML
      expect(testNode.childNodes[0].outerHTML).to.match(/name="?myName"?/)
    }
    expect(testNode.childNodes[0].getAttribute('name')).to.deep.equal('myName')

    // Also check we can remove it (which, for a name attribute, means setting it to an empty string)
    myValue(false)
    expect(testNode.childNodes[0].name).to.deep.equal('')
    if (testNode.childNodes[0].outerHTML) {
      // Old Firefox doesn't support outerHTML
      expect(testNode.childNodes[0].outerHTML).to.not.match(/name="?([^">]+)/)
    }
    expect(testNode.childNodes[0].getAttribute('name')).to.deep.equal('')

    // Check that special characters are handled appropriately
    myValue('<A name with special &\'" chars>')
    expect(testNode.childNodes[0].name).to.deep.equal('<A name with special &\'" chars>')
    if (testNode.childNodes[0].outerHTML) {
      // Old Firefox doesn't support outerHTML
      expect(testNode.childNodes[0].outerHTML).to.match(
        /name="?(<|&lt;)A name with special &amp;'&quot; chars(>|&gt;)"?/
      )
    }
    expect(testNode.childNodes[0].getAttribute('name')).to.deep.equal('<A name with special &\'" chars>')
  })

  it('Should respond to changes in an observable value', function () {
    var model = { myprop: ko.observable('initial value') }
    testNode.innerHTML = "<div data-bind='attr: { someAttrib: myprop }'></div>"
    ko.applyBindings(model, testNode)
    expect(testNode.childNodes[0].getAttribute('someAttrib')).to.deep.equal('initial value')

    // Change the observable; observe it reflected in the DOM
    model.myprop('new value')
    expect(testNode.childNodes[0].getAttribute('someAttrib')).to.deep.equal('new value')
  })

  it('Should remove the attribute if the value is strictly false, null, or undefined', function () {
    var model = { myprop: ko.observable() }
    testNode.innerHTML = "<div data-bind='attr: { someAttrib: myprop }'></div>"
    ko.applyBindings(model, testNode)
    ko.utils.arrayForEach([false, null, undefined], function (testValue) {
      model.myprop('nonempty value')
      expect(testNode.childNodes[0].getAttribute('someAttrib')).to.deep.equal('nonempty value')
      model.myprop(testValue)
      expect(testNode.childNodes[0].getAttribute('someAttrib')).to.deep.equal(null)
    })
  })

  it('Should be able to set class attribute and access it using className property', function () {
    var model = { myprop: ko.observable('newClass') }
    testNode.innerHTML = "<div class='oldClass' data-bind=\"attr: {'class': myprop}\"></div>"
    expect(testNode.childNodes[0].className).to.deep.equal('oldClass')
    ko.applyBindings(model, testNode)
    expect(testNode.childNodes[0].className).to.deep.equal('newClass')
    // Should be able to clear class also
    model.myprop(undefined)
    expect(testNode.childNodes[0].className).to.deep.equal('')
    expect(testNode.childNodes[0].getAttribute('class')).to.deep.equal(null)
  })
})
