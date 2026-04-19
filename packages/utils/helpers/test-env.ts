// Detectors for the vitest environment a test is running under.

export function isHappyDom(): boolean {
  return typeof navigator !== 'undefined' && /HappyDOM/i.test(navigator.userAgent ?? '')
}

export function isRealBrowser(): boolean {
  return typeof window !== 'undefined' &&
    !isHappyDom() &&
    typeof (window as any).PlaywrightTestingLibrary !== 'undefined'
    ? true
    : typeof navigator !== 'undefined' &&
        /Chrome|Firefox|Safari|WebKit/i.test(navigator.userAgent ?? '') &&
        !isHappyDom()
}

export function isNode(): boolean {
  return typeof document === 'undefined'
}

// Env-scoped test wrappers — semantic labels for tests that require a real
// browser and don't survive happy-dom's DOM-implementation gaps. Using a
// wrapper keeps call-site indent identical to an unskipped `it(...)` and
// lets each skip carry a short `// happy-dom gap: …` comment above it.
// Cast is needed because `@types/mocha` describes `it` as `TestFunction`
// while vitest's `it.skip` is the same shape — we just keep the outer type.
export const itBrowserOnly = (isHappyDom() ? it.skip : it) as typeof it
export const describeBrowserOnly = (isHappyDom() ? describe.skip : describe) as typeof describe
