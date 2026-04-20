// Detector for the vitest environment a test is running under.
// Tests that can't run under happy-dom should guard their body with:
//   it('name', function (ctx: any) {
//     if (isHappyDom()) return ctx.skip('happy-dom: reason')
//     // ...
//   })

export function isHappyDom(): boolean {
  return typeof navigator !== 'undefined' && /HappyDOM/i.test(navigator.userAgent ?? '')
}
