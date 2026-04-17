// Detectors for the vitest environment a test is running under.
// Used with `it.skipIf(isHappyDom())` / `describe.skipIf(isHappyDom())`
// to document known-divergent behavior rather than silently excluding it.
// Each skip should come with a short comment and (when applicable) a link
// to the upstream tracker.

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
