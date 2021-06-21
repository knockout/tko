
import {
  DataBindProvider
} from '@tko/provider.databind'

import parseObjectLiteral from '../dist/preparse'

describe('Expression Rewriting', function () {
  var preProcessBindings

  beforeEach(function () {
    const provider = new DataBindProvider()
    preProcessBindings = provider.preProcessBindings.bind(provider)
  })

  it('Should be able to parse simple object literals', function () {
    var result = parseObjectLiteral("a: 1, b: 2, \"quotedKey\": 3, 'aposQuotedKey': 4")
    expect(result.length).to.equal(4)
    expect(result[0].key).to.equal('a')
    expect(result[0].value).to.equal('1')
    expect(result[1].key).to.equal('b')
    expect(result[1].value).to.equal('2')
    expect(result[2].key).to.equal('quotedKey')
    expect(result[2].value).to.equal('3')
    expect(result[3].key).to.equal('aposQuotedKey')
    expect(result[3].value).to.equal('4')
  })

  it('Should ignore any outer braces', function () {
    var result = parseObjectLiteral('{a: 1}')
    expect(result.length).to.equal(1)
    expect(result[0].key).to.equal('a')
    expect(result[0].value).to.equal('1')
  })

  it('Should be able to parse object literals containing string literals', function () {
    var result = parseObjectLiteral("a: \"comma, colon: brace{ bracket[ apos' escapedQuot\\\" end\", b: 'escapedApos\\' brace} bracket] quot\"', c: `escapedTick\\` and more`")
    expect(result).to.deep.equal([
      { key: 'a', value: "\"comma, colon: brace{ bracket[ apos' escapedQuot\\\" end\"" },
      { key: 'b', value: "'escapedApos\\' brace} bracket] quot\"'" },
      { key: 'c', value: '`escapedTick\\` and more`' }
    ])
  })

  it('Should be able to parse object literals containing child objects, arrays, function literals, and newlines', function () {
      // The parsing may or may not keep unnecessary spaces. So to avoid confusion, avoid unnecessary spaces.
    var result = parseObjectLiteral(
          "myObject:{someChild:{},someChildArray:[1,2,3],\"quotedChildProp\":'string value'},\n" +
        "someFn:function(a,b,c){var regex=/{/;var str='/})({';return{};}," +
        "myArray:[{},function(){},\"my'Str\",'my\"Str']"
      )
    expect(result.length).to.equal(3)
    expect(result[0].key).to.equal('myObject')
    expect(result[0].value).to.equal("{someChild:{},someChildArray:[1,2,3],\"quotedChildProp\":'string value'}")
    expect(result[1].key).to.equal('someFn')
    expect(result[1].value).to.equal("function(a,b,c){var regex=/{/;var str='/})({';return{};}")
    expect(result[2].key).to.equal('myArray')
    expect(result[2].value).to.equal("[{},function(){},\"my'Str\",'my\"Str']")
  })

  it('Should correctly parse object literals containing property access using bracket notation', function () {
      // We can verify that strings are parsed correctly by including important characters in them (like commas)
    var result = parseObjectLiteral("a: x[\" , \"], b: x[' , '], c: x[` , `]")
    expect(result).to.deep.equal([
      { key: 'a', value: 'x[" , "]' },
      { key: 'b', value: "x[' , ']" },
      { key: 'c', value: 'x[` , `]' }
    ])
  })

  it('Should be able to parse object literals containing division and regular expressions', function () {
    var result = parseObjectLiteral('div: null/5, regexpFunc: function(){var regex=/{/g;return /123/;}')
    expect(result.length).to.equal(2)
    expect(result[0].key).to.equal('div')
    expect(result[0].value).to.equal('null/5')
    expect(result[1].key).to.equal('regexpFunc')
    expect(result[1].value).to.equal('function(){var regex=/{/g;return/123/;}')
  })

  it('Should parse a value that begins with a colon', function () {
    var result = parseObjectLiteral('a: :-)')
    expect(result.length).to.equal(1)
    expect(result[0].key).to.equal('a')
    expect(result[0].value).to.equal(':-)')
  })

  it('Should be able to cope with malformed syntax (things that aren\'t key-value pairs)', function () {
    var result = parseObjectLiteral("malformed1, 'mal:formed2', good:3, {malformed:4}, good5:5, keyonly:")
    expect(result.length).to.equal(6)
    expect(result[0].unknown).to.equal('malformed1')
    expect(result[1].unknown).to.equal('mal:formed2')
    expect(result[2].key).to.equal('good')
    expect(result[2].value).to.equal('3')
    expect(result[3].unknown).to.equal('{malformed:4}')
    expect(result[4].key).to.equal('good5')
    expect(result[4].value).to.equal('5')
    expect(result[5].unknown).to.equal('keyonly')
  })

  it('Should ensure all keys are wrapped in quotes', function () {
    const rewritten = preProcessBindings("a: 1, 'b': 2, \"c\": 3")
    expect(rewritten).to.equal("'a':1,'b':2,'c':3")
  })

  it('(Private API) Should convert writable values to property accessors', function () {
      // Note that both _twoWayBindings and _ko_property_writers are undocumented private APIs.
      // We reserve the right to remove or change either or both of these, especially if we
      // create an official public property writers API.

    var rewritten = preProcessBindings(
      'a : 1, b : firstName, c : function() { return "returnValue"; }, ' +
      'd: firstName+lastName, e: boss.firstName, f: boss . lastName, ' +
      'g: getAssistant(), h: getAssistant().firstName, i: getAssistant("[dummy]")[ "lastName" ], ' +
      'j: boss.firstName + boss.lastName'
    )
    const assistant = { firstName: 'john', lastName: 'english' }
    let firstName = 'bob'
    let lastName = 'smith'
    let boss = { firstName: 'rick', lastName: 'martin' }
    let getAssistant = () => assistant

    var model = { firstName, lastName, boss, getAssistant }

    const parsed = eval('({' + rewritten + '})')   // eslint-disable-line
          // test values of property
    expect(parsed.a).to.equal(1)
    expect(parsed.b).to.equal('bob')
    expect(parsed.b).to.equal(model.firstName)
    expect(parsed.c()).to.equal('returnValue')
    expect(parsed.d).to.equal('bobsmith')
    expect(parsed.e).to.equal('rick')
    expect(parsed.f).to.equal('martin')
    expect(parsed.g).to.equal(assistant)
    expect(parsed.h).to.equal('john')
    expect(parsed.i).to.equal('english')
  })

  it('Should be able to eval rewritten literals that contain unquoted keywords as keys', function () {
    var rewritten = preProcessBindings('if: true')
    expect(rewritten).to.equal("'if':true")
    var evaluated = eval('({' + rewritten + '})')   // eslint-disable-line
    expect(evaluated['if']).to.equal(true)
  })

  it('Should eval keys without a value as if the value is undefined', function () {
    var rewritten = preProcessBindings('a: 1, b')
    var parsedRewritten = eval('({' + rewritten + '})')  // eslint-disable-line
    expect(parsedRewritten.a).to.equal(1)
    expect('b' in parsedRewritten).to.be.ok // eslint-disable-line
    expect(parsedRewritten.b).to.be.undefined // eslint-disable-line
  })

  xit('Should return accessor functions for each value when called with the valueAccessors option', function () {
    // Deprecated
    var rewritten = preProcessBindings('a: 1', {valueAccessors: true})
    expect(rewritten).to.equal("'a':function(){return 1 }")
    var evaluated = eval('({' + rewritten + '})')   // eslint-disable-line
    expect(evaluated['a']()).to.equal(1)
  })

  it('Should be able to parse and evaluate object literals containing division', function () {
      // Test a variety of expressions that include a division
      // The final regex ensures that each of the divisions is run through the code that distinguishes between the two types of slashes
    var result = parseObjectLiteral("a: null/1, b: 2/1, c: (6) / 2, d: '2'/2, r: /a regex/")
    expect(result).to.deep.equal([
      {key: 'a', value: 'null/1'},
      {key: 'b', value: '2/1'},
      {key: 'c', value: '(6)/2'},
      {key: 'd', value: '\'2\'/2'},
      {key: 'r', value: '/a regex/'}])
    var rewritten = preProcessBindings(result)
    var evaluated = eval('({' + rewritten + '})')   // eslint-disable-line
    expect(evaluated.a).to.equal(0)
    expect(evaluated.b).to.equal(2)
    expect(evaluated.c).to.equal(3)
    expect(evaluated.d).to.equal(1)
  })

  it('Should return an empty array for an empty string', function () {
    var result = parseObjectLiteral('')
    expect(result).to.deep.equal([])
  })

  it('Should be able to parse object literals containing C++ style comments', function () {
      // From https://github.com/knockout/knockout/issues/1524
    var result = parseObjectLiteral(
          'model: router.activeItem, //wiring the router\n' +
          'afterCompose: router.afterCompose, //wiring the router\n' +
          "//transition:'entrance', //use the 'entrance' transition when switching views\n" +
          'skipTransitionOnSameViewId: true,//Transition entrance is disabled for better perfomance\n' +
          'cacheViews:true //telling composition to keep views in the dom, and reuse them (only a good idea with singleton view models)\n')
    expect(result).to.deep.equal([
              { key: 'model', value: 'router.activeItem' },
              { key: 'afterCompose', value: 'router.afterCompose' },
              { key: 'skipTransitionOnSameViewId', value: 'true' },
              { key: 'cacheViews', value: 'true' }
    ])
  })

  it('Should be able to parse object literals containing C style comments', function () {
    var result = parseObjectLiteral(
          'a: xxx, /* First comment */\n' +
          'b: yyy, /* Multi-line comment that comments-out the next whole line\n' +
          "x: 'nothing', //this is also skipped */\n" +
          'c: zzz, /***Comment with extra * at various parts****/\n' +
          "d: /**/'empty comment'")
    expect(result).to.deep.equal([
              { key: 'a', value: 'xxx' },
              { key: 'b', value: 'yyy' },
              { key: 'c', value: 'zzz' },
              { key: 'd', value: "'empty comment'" }
    ])
  })
})
