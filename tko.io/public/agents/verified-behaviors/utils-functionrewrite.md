# Verified Behaviors: @tko/utils.functionrewrite

> Generated from package discovery + curated JSON. Unit-test-backed only.

Rewriting classic function literals in binding strings.

status: curated · specs: `packages/utils.functionrewrite/spec` · curated: `packages/utils.functionrewrite/verified-behaviors.json`

## Behaviors

- `functionRewrite()` rewrites classic `function (...) { ... }` binding expressions into arrow-function form.
  Specs: `packages/utils.functionrewrite/spec/functionRewriteBehavior.ts`
- Empty-body functions become `() => undefined`; `return ...` bodies become concise return arrows.
  Specs: `packages/utils.functionrewrite/spec/functionRewriteBehavior.ts`
- Multiple function literals in the same binding string are rewritten independently.
  Specs: `packages/utils.functionrewrite/spec/functionRewriteBehavior.ts`
- Non-function text is left unchanged.
  Specs: `packages/utils.functionrewrite/spec/functionRewriteBehavior.ts`
