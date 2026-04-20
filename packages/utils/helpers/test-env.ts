// Detectors for the vitest environment a test is running under.
// Tests that can't run in a given env should guard their body with:
//   it('name', function (ctx: any) {
//     if (!isRealBrowser()) return ctx.skip('happy-dom: reason')
//     // ...
//   })

export function isHappyDom(): boolean {
  return typeof navigator !== 'undefined' && /HappyDOM/i.test(navigator.userAgent ?? '')
}

export function isNode(): boolean {
  return typeof document === 'undefined'
}

export function isRealBrowser(): boolean {
  return !isHappyDom() && !isNode()
}
