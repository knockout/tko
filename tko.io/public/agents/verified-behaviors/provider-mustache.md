# Verified Behaviors: @tko/provider.mustache

> Generated from package discovery + curated JSON. Unit-test-backed only.

Mustache-style text and attribute interpolation providers.

## Behaviors

- Text interpolation rewrites `{{expr}}` into virtual `text` bindings, `{{{expr}}}` into virtual `html` bindings, and `{{#binding:value}}{{/binding}}` into virtual block bindings.
  Specs: `packages/provider.mustache/spec/textInterpolationSpec.ts`
- Unclosed or unopened delimiters are ignored in both text and attribute interpolation; unmatched trailing delimiters are treated as literal text.
  Specs: `packages/provider.mustache/spec/textInterpolationSpec.ts`, `packages/provider.mustache/spec/attributeInterpolationSpec.ts`
- Attribute interpolation supports multiple expressions per attribute, multiple interpolated attributes on the same element, and backtick expressions.
  Specs: `packages/provider.mustache/spec/attributeInterpolationSpec.ts`
- Interpolated text and attributes update when their source observables change.
  Specs: `packages/provider.mustache/spec/textInterpolationSpec.ts`, `packages/provider.mustache/spec/attributeInterpolationSpec.ts`
- Interpolated `value` and `checked` attributes become two-way bindings.
  Specs: `packages/provider.mustache/spec/attributeInterpolationSpec.ts`
- Text interpolation does not rewrite contents inside `<textarea>` or `<script>`, but it does work inside templates declared with `<script>` and `<textarea>`.
  Specs: `packages/provider.mustache/spec/textInterpolationSpec.ts`

_Curated source: `packages/provider.mustache/verified-behaviors.json`_
