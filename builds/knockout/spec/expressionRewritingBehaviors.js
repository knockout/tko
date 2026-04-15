describe('Expression Rewriting', function () {
  it('Should be able to parse simple object literals', function () {
    var result = ko.utils.parseObjectLiteral('a: 1, b: 2, "quotedKey": 3, \'aposQuotedKey\': 4')
    expect(result.length).to.deep.equal(4)
    expect(result[0].key).to.deep.equal('a')
    expect(result[0].value).to.deep.equal('1')
    expect(result[1].key).to.deep.equal('b')
    expect(result[1].value).to.deep.equal('2')
    expect(result[2].key).to.deep.equal('quotedKey')
    expect(result[2].value).to.deep.equal('3')
    expect(result[3].key).to.deep.equal('aposQuotedKey')
    expect(result[3].value).to.deep.equal('4')
  })

  it('Should ignore any outer braces', function () {
    var result = ko.utils.parseObjectLiteral('{a: 1}')
    expect(result.length).to.deep.equal(1)
    expect(result[0].key).to.deep.equal('a')
    expect(result[0].value).to.deep.equal('1')
  })

  it('Should be able to parse object literals containing string literals', function () {
    var result = ko.utils.parseObjectLiteral(
      'a: "comma, colon: brace{ bracket[ apos\' escapedQuot\\" end", b: \'escapedApos\\\' brace} bracket] quot"\', c: `escapedTick\\` and more`'
    )
    expect(result).to.deep.equal([
      { key: 'a', value: '"comma, colon: brace{ bracket[ apos\' escapedQuot\\" end"' },
      { key: 'b', value: "'escapedApos\\' brace} bracket] quot\"'" },
      { key: 'c', value: '`escapedTick\\` and more`' }
    ])
  })

  it('Should be able to parse object literals containing child objects, arrays, function literals, and newlines', function () {
    // The parsing may or may not keep unnecessary spaces. So to avoid confusion, avoid unnecessary spaces.
    var result = ko.utils.parseObjectLiteral(
      'myObject:{someChild:{},someChildArray:[1,2,3],"quotedChildProp":\'string value\'},\n' +
        "someFn:function(a,b,c){var regex=/{/;var str='/})({';return{};}," +
        'myArray:[{},function(){},"my\'Str",\'my"Str\']'
    )
    expect(result.length).to.deep.equal(3)
    expect(result[0].key).to.deep.equal('myObject')
    expect(result[0].value).to.deep.equal('{someChild:{},someChildArray:[1,2,3],"quotedChildProp":\'string value\'}')
    expect(result[1].key).to.deep.equal('someFn')
    expect(result[1].value).to.deep.equal("function(a,b,c){var regex=/{/;var str='/})({';return{};}")
    expect(result[2].key).to.deep.equal('myArray')
    expect(result[2].value).to.deep.equal('[{},function(){},"my\'Str",\'my"Str\']')
  })

  it('Should correctly parse object literals containing property access using bracket notation', function () {
    // We can verify that strings are parsed correctly by including important characters in them (like commas)
    var result = ko.utils.parseObjectLiteral('a: x[" , "], b: x[\' , \'], c: x[` , `]')
    expect(result).to.deep.equal([
      { key: 'a', value: 'x[" , "]' },
      { key: 'b', value: "x[' , ']" },
      { key: 'c', value: 'x[` , `]' }
    ])
  })

  it('Should be able to parse object literals containing division and regular expressions', function () {
    var result = ko.utils.parseObjectLiteral('div: null/5, regexpFunc: function(){var regex=/{/g;return /123/;}')
    expect(result.length).to.deep.equal(2)
    expect(result[0].key).to.deep.equal('div')
    expect(result[0].value).to.deep.equal('null/5')
    expect(result[1].key).to.deep.equal('regexpFunc')
    expect(result[1].value).to.deep.equal('function(){var regex=/{/g;return/123/;}')
  })

  it('Should parse a value that begins with a colon', function () {
    var result = ko.utils.parseObjectLiteral('a: :-)')
    expect(result.length).to.deep.equal(1)
    expect(result[0].key).to.deep.equal('a')
    expect(result[0].value).to.deep.equal(':-)')
  })

  it("Should be able to cope with malformed syntax (things that aren't key-value pairs)", function () {
    var result = ko.utils.parseObjectLiteral("malformed1, 'mal:formed2', good:3, {malformed:4}, good5:5, keyonly:")
    expect(result.length).to.deep.equal(6)
    expect(result[0].unknown).to.deep.equal('malformed1')
    expect(result[1].unknown).to.deep.equal('mal:formed2')
    expect(result[2].key).to.deep.equal('good')
    expect(result[2].value).to.deep.equal('3')
    expect(result[3].unknown).to.deep.equal('{malformed:4}')
    expect(result[4].key).to.deep.equal('good5')
    expect(result[4].value).to.deep.equal('5')
    expect(result[5].unknown).to.deep.equal('keyonly')
  })

  it.skip('Should ensure all keys are wrapped in quotes', function () {
    var rewritten = ko.expressionRewriting.preProcessBindings('a: 1, \'b\': 2, "c": 3')
    expect(rewritten).to.deep.equal("'a':1,'b':2, 'c':3")
  })

  it.skip('(Private API) Should convert writable values to property accessors', function () {
    // Note that both _twoWayBindings and _ko_property_writers are undocumented private APIs.
    // We reserve the right to remove or change either or both of these, especially if we
    // create an official public property writers API.
    var w = ko.expressionRewriting._twoWayBindings
    w.a = w.b = w.c = w.d = w.e = w.f = w.g = w.h = w.i = w.j = true

    var rewritten = ko.expressionRewriting.preProcessBindings(
      'a : 1, b : firstName, c : function() { return "returnValue"; }, ' +
        'd: firstName+lastName, e: boss.firstName, f: boss . lastName, ' +
        'g: getAssistant(), h: getAssistant().firstName, i: getAssistant("[dummy]")[ "lastName" ], ' +
        'j: boss.firstName + boss.lastName'
    )

    // Clear the two-way flag
    w.a = w.b = w.c = w.d = w.e = w.f = w.g = w.h = w.i = w.j = false

    var assistant = { firstName: 'john', lastName: 'english' }
    var model = {
      firstName: 'bob',
      lastName: 'smith',
      boss: { firstName: 'rick', lastName: 'martin' },
      getAssistant: function () {
        return assistant
      }
    }
    // with (model) {
    //     var parsed = eval("({" + rewritten + "})");
    //     // test values of property
    //     expect(parsed.a).to.deep.equal(1);
    //     expect(parsed.b).to.deep.equal("bob");
    //     expect(parsed.c()).to.deep.equal("returnValue");
    //     expect(parsed.d).to.deep.equal("bobsmith");
    //     expect(parsed.e).to.deep.equal("rick");
    //     expect(parsed.f).to.deep.equal("martin");
    //     expect(parsed.g).to.deep.equal(assistant);
    //     expect(parsed.h).to.deep.equal("john");
    //     expect(parsed.i).to.deep.equal("english");

    //     // test that only writable expressions are set up for writing
    //     // 'j' matches due to the simple checking for trailing property accessor
    //     expect(parsed._ko_property_writers).toHaveOwnProperties(['b','e','f','h','i','j']);

    //     // make sure writing to them works
    //     parsed._ko_property_writers.b("bob2");
    //     expect(model.firstName).to.deep.equal("bob2");
    //     parsed._ko_property_writers.e("rick2");
    //     expect(model.boss.firstName).to.deep.equal("rick2");
    //     parsed._ko_property_writers.f("martin2");
    //     expect(model.boss.lastName).to.deep.equal("martin2");
    //     parsed._ko_property_writers.h("john2");
    //     expect(assistant.firstName).to.deep.equal("john2");
    //     parsed._ko_property_writers.i("english2");
    //     expect(assistant.lastName).to.deep.equal("english2");

    //     // make sure writing to 'j' doesn't error or actually change anything
    //     parsed._ko_property_writers.j("nothing at all");
    //     expect(model.boss.firstName).to.deep.equal("rick2");
    //     expect(model.boss.lastName).to.deep.equal("martin2");
    // }
  })

  it.skip('Should be able to eval rewritten literals that contain unquoted keywords as keys', function () {
    var rewritten = ko.expressionRewriting.preProcessBindings('if: true')
    expect(rewritten).to.deep.equal("'if':true")
    var evaluated = eval('({' + rewritten + '})')
    expect(evaluated['if']).to.deep.equal(true)
  })

  it.skip('Should eval keys without a value as if the value is undefined', function () {
    var rewritten = ko.expressionRewriting.preProcessBindings('a: 1, b')
    var parsedRewritten = eval('({' + rewritten + '})')
    expect(parsedRewritten.a).to.deep.equal(1)
    expect('b' in parsedRewritten).to.be.ok
    expect(parsedRewritten.b).to.equal(undefined)
  })

  it.skip('Should return accessor functions for each value when called with the valueAccessors option', function () {
    var rewritten = ko.expressionRewriting.preProcessBindings('a: 1', { valueAccessors: true })
    expect(rewritten).to.deep.equal("'a':function(){return 1 }")
    var evaluated = eval('({' + rewritten + '})')
    expect(evaluated['a']()).to.deep.equal(1)
  })

  it.skip('Should be able to parse and evaluate object literals containing division', function () {
    // Test a variety of expressions that include a division
    // The final regex ensures that each of the divisions is run through the code that distinguishes between the two types of slashes
    var result = ko.utils.parseObjectLiteral("a: null/1, b: 2/1, c: (6) / 2, d: '2'/2, r: /a regex/")
    expect(result).to.deep.equal([
      { key: 'a', value: 'null/1' },
      { key: 'b', value: '2/1' },
      { key: 'c', value: '(6)/2' },
      { key: 'd', value: "'2'/2" },
      { key: 'r', value: '/a regex/' }
    ])
    var rewritten = ko.expressionRewriting.preProcessBindings(result, { valueAccessors: true })
    var evaluated = eval('({' + rewritten + '})')
    expect(evaluated.a()).to.deep.equal(0)
    expect(evaluated.b()).to.deep.equal(2)
    expect(evaluated.c()).to.deep.equal(3)
    expect(evaluated.d()).to.deep.equal(1)
  })

  it('Should return an empty array for an empty string', function () {
    var result = ko.utils.parseObjectLiteral('')
    expect(result).to.deep.equal([])
  })

  it('Should be able to parse object literals containing C++ style comments', function () {
    // From https://github.com/knockout/knockout/issues/1524
    var result = ko.utils.parseObjectLiteral(
      'model: router.activeItem, //wiring the router\n' +
        'afterCompose: router.afterCompose, //wiring the router\n' +
        "//transition:'entrance', //use the 'entrance' transition when switching views\n" +
        'skipTransitionOnSameViewId: true,//Transition entrance is disabled for better performance\n' +
        'cacheViews:true //telling composition to keep views in the dom, and reuse them (only a good idea with singleton view models)\n'
    )
    expect(result).to.deep.equal([
      { key: 'model', value: 'router.activeItem' },
      { key: 'afterCompose', value: 'router.afterCompose' },
      { key: 'skipTransitionOnSameViewId', value: 'true' },
      { key: 'cacheViews', value: 'true' }
    ])
  })

  it('Should be able to parse object literals containing C style comments', function () {
    var result = ko.utils.parseObjectLiteral(
      'a: xxx, /* First comment */\n' +
        'b: yyy, /* Multi-line comment that comments-out the next whole line\n' +
        "x: 'nothing', //this is also skipped */\n" +
        'c: zzz, /***Comment with extra * at various parts****/\n' +
        "d: /**/'empty comment'"
    )
    expect(result).to.deep.equal([
      { key: 'a', value: 'xxx' },
      { key: 'b', value: 'yyy' },
      { key: 'c', value: 'zzz' },
      { key: 'd', value: "'empty comment'" }
    ])
  })
})
