---
name: typescript-code-review
description: Perform comprehensive code reviews for LLM-based linting of TypeScript projects. Analyzing type safety, best practices, clientside security and code quality. Result are actionable and ranked findings.
---

# TypeScript Code Review Skill

## Review Process

### 1. Initial Assessment
- Understand purpose, scope, TS version, and `tsconfig.json` settings
- Check for relevant docs, comments, and existing patterns

### 2. Core Review Categories

#### Type Safety
- Verify `strict: true` and adherence; flag implicit `any`
- Type guards, narrowing, and exhaustiveness checking for unions
- Flag unnecessary type assertions (`as`, `!`); prefer `satisfies` or `instanceof`
- Proper `?.` and `??` usage; explicit return types on functions
- Generics constrained appropriately; discriminated unions with `type` field

#### Code Quality
- **Naming**: camelCase vars/fns, PascalCase types/classes; `is`/`has` for booleans; `get` for sync accessors, `fetch` for async IO; `is` for type predicates
- **Functions**: max ~50 lines, max 3 params (use options object for more), no boolean flag params, prefer pure functions
- **Constants**: no magic numbers/strings; use named constants
- **Equality**: `===`/`!==` only (no `==`)
- **Errors**: throw `Error` objects only; handle promise rejections
- **Immutability**: prefer `const`, spread over mutation
- **Enums**: prefer union types or `as const` lookup tables (enums emit runtime code)
- **Defaults**: use ES6 parameter defaults, destructuring, spread

#### Code Organization
- Prefer `function` declarations at file scope (hoisting, stack traces); arrows for callbacks
- Guard clauses / early returns over deep nesting (max 3-4 levels)
- Import order: external libs → workspace packages → relative → type-only
- `import type` mandatory with `verbatimModuleSyntax`
- File order: constants → types → setup → functions → exports
- `interface` for object shapes; `type` for unions/intersections/mapped types
- String unions for fixed value sets

#### Modern TS Features
- `?.`, `??`, template literal types, utility types (`Partial`, `Pick`, `Omit`, `Record`)
- `as const` for literal types and lookup tables; `satisfies` for validation
- Type predicates for custom guards

#### Security
- Validate/sanitize user input at system boundaries; no `innerHTML` with untrusted data; no `eval`
- No hardcoded secrets, tokens, or API keys — use environment variables
- Strip sensitive fields before exposing data: `Omit<User, 'password'>`
- Don't log sensitive data (passwords, tokens, PII)
- Types as security layer: union types for allowed values, type guards at boundaries
- `npm audit` dependencies; minimize count; review new packages before adding

#### Testing & Maintainability
- Note missing tests for critical paths; flag circular dependencies
- Use `import type` for type-only imports; verify JSDoc on public APIs

### 3. Output Format

```markdown
## Summary
[Overview: quality, main concerns, highlights]

## Critical Issues 🔴
[Must fix: type errors, security vulns, bugs]

## Important Improvements 🟡
[Maintainability, performance, anti-patterns]

## Suggestions 🔵
[Nice-to-have: style, optimizations]

## Positive Observations ✅
[Good patterns to reinforce]

## Detailed Findings
### [Category]
**File**: `path/file.ts:line`
- **Issue**: [Description]
- **Current**: `[code]`
- **Recommended**: `[improved code]`
- **Why**: [Reasoning]
```

### 4. Guidelines
- Constructive, specific, with code examples. Severity: 🔴 critical → 🟡 important → 🔵 suggestion
- Priority: security/bugs → anti-patterns → style
- Respect existing patterns; note tradeoffs; reference tsconfig

### 5. References

Grep references for specific topics:
- `references/review-reference.md` — type safety checklist, anti-patterns with bad/good examples
- `references/tko-conventions.md` — TKO monorepo-specific patterns and overrides
- `AGENTS.md` — when to use this skill vs others

### 6. tsconfig Review

Recommended strict settings: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`,
`noPropertyAccessFromIndexSignature`, `exactOptionalPropertyTypes`,
`noFallthroughCasesInSwitch`, `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`.

### 7. TKO Monorepo Conventions

When reviewing TKO code, apply these overrides:

**Architecture** (do NOT flag):
- Factory-function-as-constructor with `Object.setPrototypeOf` / `.fn` prototypes — core pattern
- Module-level side effects (prototype wiring, Symbol polyfills) — essential
- Pervasive `any` — accepted tech debt (`no-explicit-any: off`, `noImplicitAny: false`). Flag only in net-new code
- `prefer-const` is off — `let` for never-reassigned vars is fine
- No enums, no `readonly`, minimal `as const` in existing code

**DO flag**:
- Missing `import type` (mandatory: `verbatimModuleSyntax: true`)
- Missing DOM disposal (`disposeWhenNodeIsRemoved`, `addDisposeCallback`, `LifeCycle.anchorTo()`)
- Violations of centralized error handling (`options.onError` pattern)

**Testing**: Mocha/Chai/Sinon (not Jasmine); vitest; tests in `packages/*/spec/`.
**Zero runtime deps**: never suggest external packages for core `@tko/*` packages.

See `references/tko-conventions.md` for full details.

### 8. Review Workflow

1. Scan critical issues (type errors, security, bugs)
2. Review architecture (modules, boundaries, separation of concerns)
3. Deep-dive logic (correctness, edge cases, error handling)
4. Check types (accuracy, safety, TS feature usage)
5. Style/consistency (naming, formatting, patterns)
6. Testing/docs (coverage, clarity)

## When to Use

Activate when user asks for code review, feedback on TS implementation,
checking for issues/bugs, or ensuring best practices.
