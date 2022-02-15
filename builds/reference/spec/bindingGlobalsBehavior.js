import tko from '..'

describe('options.bindingGlobals', () => {
  it('is not globalThis by default', () => {
    expect(Object.getPrototypeOf(tko.options.bindingGlobals)).to.be.null

    globalThis.testFoo = "bar"
    expect(tko.options.bindingGlobals.testFoo).to.be.undefined

    tko.options.bindingGlobals.testFoo = 1
    expect(tko.options.bindingGlobals.testFoo).to.equal(1)
  })
})
