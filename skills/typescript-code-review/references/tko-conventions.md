# TKO Monorepo Conventions

Review guidelines specific to the TKO (Technical Knockout) monorepo. TKO is a
TypeScript MVVM framework for data binding and templating — the next generation
of Knockout.js.

## Core Architecture

### Factory-Function-as-Constructor Pattern

TKO's core primitives (`observable`, `computed`, `subscribable`) use factory
functions that return callable function-objects, not class instances. Prototypes
are wired up via `Object.setPrototypeOf`. This is currently acceptable for reasons of
compatibility with Knockout.

```typescript
// This is idiomatic TKO — NOT an anti-pattern
export function observable(initialValue) {
  function obs() { /* ... */ }
  Object.setPrototypeOf(obs, observable.fn)
  obs[LATEST_VALUE] = initialValue
  return obs
}

observable.fn = { /* shared methods */ }
Object.setPrototypeOf(observable.fn, subscribable.fn)
```

**Do NOT flag**: `Object.setPrototypeOf`, `.fn` prototype objects, factory functions
returning function-objects.

### Module-Level Side Effects

Some modules intentionally execute code at import time:
- Prototype chain wiring (`Object.setPrototypeOf` calls)
- `Symbol.observable` polyfill in subscribable
- Prototype extension via `.fn` objects

**Do NOT flag** these as "avoid side effects." They are essential architecture.

### Symbol-Based Unique Keys

TKO uses `Symbol()` and `createSymbolOrString()` for unique keys on objects
rather than string literals or enums:

```typescript
const LATEST_VALUE = Symbol('LatestValue')
const computedState = Symbol('ComputedState')
const SUBSCRIBABLE_SYM = Symbol('Subscribable')
```

This is the preferred discriminator pattern.

---

## TypeScript Configuration

Key settings to be aware of:

| Setting | Value | Implication |
|---------|-------|-------------|
| `strict` | `true` | Strict mode enabled |
| `verbatimModuleSyntax` | `true` | `import type` is mandatory for type-only imports |
| `noEmit` | `true` | esbuild handles compilation; `tsc` only type-checks |
| `target` | `ES2022` | ES2022 output target |


### `import type` Enforcement

`verbatimModuleSyntax: true` means type-only imports **must** use `import type`.
Cross-package type imports always use this form:

```typescript
// Correct
import type { Observable } from '@tko/observable'

// Wrong — will cause build errors
import { Observable } from '@tko/observable'  // if Observable is type-only
```

---

## DOM & Reactive Patterns

### Disposal is Critical

Every subscription or computed tied to a DOM node must have disposal wired up.
Missing disposal causes memory leaks.

```typescript
// LifeCycle-based binding — disposal is automatic via anchorTo()
class myBinding extends BindingHandler {
  constructor(params) {
    super(params)
    this.computed(() => {
      // auto-disposes when DOM node is removed
    })
  }
}

// Manual subscription — must wire up disposal
const sub = someObservable.subscribe(callback)
addDisposeCallback(element, () => sub.dispose())
```

**Always check**: Is there a `disposeWhenNodeIsRemoved`, `addDisposeCallback`, or
`LifeCycle.anchorTo()` for every subscription created in a binding handler?

### Centralized Error Handling

Errors flow through `options.onError` — a global error handler. Functions are
wrapped with `catchFunctionErrors()`. Per-site `try/catch` is used sparingly
and only in critical paths (computed evaluation, binding init).

Do not suggest adding try/catch to every function. Respect the delegation pattern.

### Binding Handler Styles

Both patterns are valid in the codebase:

```typescript
// Modern: class-based
class value extends BindingHandler {
  constructor(params) { super(params) }
  get controlsDescendants() { return false }
}

// Legacy: plain object with init/update
const textInput = {
  init(element, valueAccessor) { /* ... */ },
  update(element, valueAccessor) { /* ... */ }
}
```

---

## Naming Conventions

| Category | Convention | Examples |
|----------|-----------|----------|
| Files (general) | camelCase | `observable.ts`, `bindingContext.ts` |
| Files (classes) | PascalCase | `BindingHandler.ts`, `LifeCycle.ts` |
| Variables/functions | camelCase | `arrayForEach`, `registerDependency` |
| Classes | PascalCase | `BindingHandler`, `Subscription` |
| Interfaces/Types | PascalCase (no `I` prefix) | `Observable`, `ComputedOptions` |
| Binding handlers | lowercase matching binding name | `value`, `textInput`, `css` |
| Symbols/constants | UPPER_SNAKE_CASE | `LATEST_VALUE`, `DISPOSED_STATE` |
| Private members | underscore prefix | `_subscriptions`, `_isDisposed` |

---

## Package Conventions

- Inter-package deps use `@tko/package-name` (npm workspaces)
- **Zero runtime dependencies** — never add external packages to core
- **Named exports** are strongly preferred (~281 inline vs ~29 default)
- **Barrel files** (`index.ts`) re-export via `export *` and `export type { ... }`

## Testing

- **Runner**: Vitest + Playwright
- **Test location**: `packages/*/spec/**/*.ts` and `builds/*/spec/**/*.js`
- Coverage target: ~89% statements, ~83% branches

## Code Style

- Run `bun run format` before committing

## References

- More Examples are located under `/tko.io/public/`
