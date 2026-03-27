# Verified Behaviors: @tko/utils.functionrewrite

> Generated from package discovery plus package-local curated unit-test-backed JSON.
> If a behavior is not covered by unit tests, it does not belong in this directory.

Rewriting classic function literals in binding strings.

## When to Read This

Read this when you need test-backed behavior for `@tko/utils.functionrewrite`, especially rewriting classic function literals in binding strings.

## Status

- Status: curated
- Summary: Curated from unit tests.
- Spec directory: `packages/utils.functionrewrite/spec`
- Curated source: `packages/utils.functionrewrite/verified-behaviors.json`

## Behaviors

- `functionRewrite()` rewrites classic `function (...) { ... }` binding expressions into arrow-function form.
  Specs: `packages/utils.functionrewrite/spec/functionRewriteBehavior.ts`
- Empty-body functions become `() => undefined`; `return ...` bodies become concise return arrows.
  Specs: `packages/utils.functionrewrite/spec/functionRewriteBehavior.ts`
- Multiple function literals in the same binding string are rewritten independently.
  Specs: `packages/utils.functionrewrite/spec/functionRewriteBehavior.ts`
- Non-function text is left unchanged.
  Specs: `packages/utils.functionrewrite/spec/functionRewriteBehavior.ts`
