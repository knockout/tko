# Plan: KO 3.5 binding-lifecycle parity (descendantsComplete / completeOn: "render")

## Context

Knockout 3.5 has a two-event binding lifecycle:

- **`childrenComplete`** — fires synchronously each time a node's direct
  children have been bound. Bindings that render nothing (`if: false`
  without an `else`, `with: null`) still notify it, because "no content"
  is a completed state.
- **`descendantsComplete`** — fires once per rendered content cycle,
  after the node's children *and every asynchronously-completing
  descendant* (components, conditionals holding it open) are bound. KO
  tracks this with a per-node `AsyncCompleteContext` created by
  `ko.bindingEvent.startPossiblyAsyncContentBinding`; completion bubbles
  to ancestor contexts.
- **`completeOn: "render"`** — opt-in on `if`/`ifnot`/`with`/`template`.
  Defers the node's `childrenComplete` until the binding actually
  renders content, which holds ancestor `descendantsComplete` (and a
  component's `koDescendantsComplete`) open until the condition becomes
  true.

TKO replaced this bookkeeping with a promise chain: each
`AsyncBindingHandler` exposes a `bindingCompleted` promise,
`applyBindings` returns `Promise.all` over them, and
`triggerDescendantsComplete` (`packages/bind/src/applyBindings.ts`)
fires the `descendantsComplete` callback once, when the promises of the
*initial* binding pass settle. Two behavioral gaps follow:

1. `triggerDescendantsComplete` captures `virtualElements.firstChild`
   at bind time. A conditional that starts false has already emptied
   the node, so the callback is suppressed forever — it never re-arms
   when the condition later becomes true.
2. `completeOn: "render"` is not implemented at all, so the deferred
   variant of the lifecycle cannot be expressed.

Two artifacts document the divergence:

- **Issue [knockout/tko#414](https://github.com/knockout/tko/issues/414)** —
  `koDescendantsComplete` never called when a component template
  contains `<!-- ko if: false -->`. Root cause (the false branch never
  resolved its completion promise) is already fixed on `main` by
  `6f941262` ("fix: resolve async completion in
  ConditionalBindingHandler"), but that fix is **not in the released
  v4.1.0** — the changeset is still pending in `.changeset/`. After the
  next release, #414's scenario works (verified by repro against
  `main`, 2026-07-16).
- **Spec `packages/binding.core/spec/descendantsCompleteBehaviors.ts`,
  test "TKO-Change: descendantsComplete callback function is not called
  after nested 'if' binding"** — enshrines the remaining gap as if it
  were intended behavior.

Behavior matrix for that spec's markup —
`<div data-bind='if: outer, descendantsComplete: cb'>` wrapping
`<div data-bind='if: inner, childrenComplete: render'>`, both starting
false, then `outer(true)`, then `inner(true)`:

| Step            | KO 3.5 default | KO 3.5 + `completeOn: "render"` | TKO today |
| --------------- | -------------- | ------------------------------- | --------- |
| initial (both false) | cb: 0     | cb: 0                           | cb: 0     |
| `outer(true)`   | cb: 1          | cb: 0                           | cb: 0     |
| `inner(true)`   | cb: 1          | cb: 1                           | cb: 0     |

TKO today matches neither column: the callback never fires. The issue
reporter wants the KO default column; the spec author wanted the
`completeOn: "render"` column. Restoring the KO mechanism serves both,
which is why the two concerns are one plan, not two.

## Approach

Port KO 3.5's event bookkeeping into `@tko/bind` and let it own
`descendantsComplete` semantics. The promise machinery stays — it is
TKO's public async story (`applyBindings(...)` return value, SSR,
`BindingResult`) and the #414 fix depends on it. Events and promises
answer different questions ("is this content cycle rendered?" vs. "is
the initial binding pass settled?") and can coexist.

### 1. `bindingEvent` bookkeeping (`packages/bind/src/bindingEvent.ts`)

Port from KO 3.5 (`src/binding/bindingAttributeSyntax.js`):

- `AsyncCompleteContext` — per-node record of pending async
  descendants; `completeChildren()` / `descendantComplete()` /
  `notifyAncestor()`.
- `bindingEvent.startPossiblyAsyncContentBinding(node, ctx)` — creates
  the context, extends the binding context with
  `contextAncestorBindingInfo` (symbol already exists in TKO) so
  descendant contexts can find their ancestor's bookkeeping.
- `notify(node, childrenComplete)` drives the context: mark children
  complete, and when no async descendants remain, fire
  `descendantsComplete` on the node and notify the ancestor context.
- Track `notifiedEvents` per node and support KO's
  `subscribe(..., { notifyImmediately })` option.
- **Deviation from KO, on purpose:** KO throws
  `"descendantsComplete event not supported for bindings on this node"`
  when subscribing without an async context. TKO's public
  `bindingEvent.subscribe` today works on any node (covered by the
  existing spec that subscribes manually) — stay lenient, don't adopt
  the throw.

### 2. Wire-up in `applyBindings.ts`

- Replace `triggerDescendantsComplete`'s one-shot `Promise.all` with
  the KO pattern: when `bindings` contain `descendantsComplete`, call
  `startPossiblyAsyncContentBinding(node, ctx)` and subscribe a handler
  that evaluates `firstChild` **at fire time**.
- `applyBindingsToDescendantsInternal` currently early-returns when a
  node has no children and only notifies `childrenComplete` when it
  bound something. KO notifies unconditionally. Align with KO — the
  "no descendants → callback not called" behavior remains enforced by
  the fire-time `firstChild` check, not by skipping the event.
- Keep adding `bindingCompleted` promises to `asyncBindingsApplied`
  unchanged.

### 3. Descendant-controlling bindings

- **`ConditionalBindingHandler`** (`if`/`ifnot`/`with`/`else`):
  - Read `completeOn` via `allBindings.get('completeOn') === 'render'`.
    No binding handler needed for the key — KO reads it the same way,
    and TKO's `topologicalSortBindings` already skips unknown keys.
  - `needAsyncContext = completeOnRender ||
    allBindings.has('descendantsComplete')`; when set, run each render
    cycle through `startPossiblyAsyncContentBinding`.
  - False/empty branch: keep `completeBinding()` (the #414 fix — must
    not regress) and additionally notify `childrenComplete` unless
    `completeOnRender`.
  - Rendering branch with `completeOnRender`: notify `childrenComplete`
    after content is bound.
- **`ComponentBinding`**: subscribe `koDescendantsComplete` to the
  element's `descendantsComplete` event (KO parity) instead of calling
  it from `onBindingComplete`; keep `completeBinding` for the promise
  chain. Component re-renders (name/params change) then re-fire it per
  cycle, as in KO.
- **`template` / `foreach`**: audit against KO's template binding —
  `completeOn: "render"` support and per-render `childrenComplete`
  notification; foreach delegates to template in KO and should here
  too. Scope creep guard: if the audit shows template needs its own
  async-context rework, split it into a follow-up plan and land
  if/with/component parity first.

### 4. Cleanup in scope

- `packages/binding.core/src/descendantsComplete.ts`: the handler's
  `onDescendantsComplete()` is dead code today (nothing invokes it).
  Either wire the handler to the event or drop the method — after this
  plan the subscription in `applyBindings.ts` is the single path, so
  the method goes.

### 5. Specs

- Delete the "TKO-Change: …" test and replace it with the KO 3.5
  originals (from knockout/knockout `spec/asyncBehaviors.js` and
  `spec/defaultBindings/*`): nested `if` with `completeOn: "render"`
  completing outer-first **and** inner-first, the KO-default column of
  the matrix above, re-render re-firing, and `bindingEvent.subscribe`
  variants.
- Keep a regression spec for the `childrenComplete`-on-false-branch
  workaround the deleted test documented.
- Re-enable/port the `descendantsComplete` specs in
  `builds/knockout/spec/` that cover the legacy `ko.*` surface,
  including the currently skipped `koDescendantsComplete` ordering
  tests if the new bookkeeping fixes their ordering (KO order:
  inner components before outer).
- Update `verified-behaviors.json` in `bind`, `binding.core`,
  `binding.if`, `binding.component` where statements change (e.g.
  "`descendantsComplete` fires after descendant bindings finish"
  gains the conditional/re-render cases).

### 6. Release artifacts

- Changeset: minor bump on the fixed `@tko/*` release line; call out
  the behavior change ("descendantsComplete now fires for conditional
  content per KO 3.5 semantics; completeOn: 'render' supported").
- Docs: tko.io binding-lifecycle page + `tko.io/public/agents/guide.md`
  (dense, code-first), per the agent-first documentation rule.
- Comment on #414: fixed root cause ships in the next release; link
  the new lifecycle docs for `completeOn: "render"`.

## Files

| File | Change |
| ---- | ------ |
| `packages/bind/src/bindingEvent.ts` | Port `AsyncCompleteContext`, `startPossiblyAsyncContentBinding`, `notifiedEvents`, `notifyImmediately` |
| `packages/bind/src/applyBindings.ts` | Event-driven `descendantsComplete` (fire-time `firstChild`), unconditional `childrenComplete` notify |
| `packages/bind/src/bindingContext.ts` | Expose/reuse `contextAncestorBindingInfo` plumbing |
| `packages/binding.if/src/ConditionalBindingHandler.ts` | `completeOn: "render"`, false-branch `childrenComplete`, async context per render |
| `packages/binding.component/src/componentBinding.ts` | `koDescendantsComplete` via `descendantsComplete` event |
| `packages/binding.template/src/`, `packages/binding.foreach/src/` | Audit + `completeOn` parity (possible follow-up split) |
| `packages/binding.core/src/descendantsComplete.ts` | Remove dead `onDescendantsComplete` |
| `packages/binding.core/spec/descendantsCompleteBehaviors.ts` | Replace "TKO-Change" test with KO originals |
| `packages/{bind,binding.if,binding.component}/spec/` | New/ported lifecycle specs |
| `builds/knockout/spec/components/componentBindingBehaviors.js` | Un-skip ordering tests if fixed |
| `packages/*/verified-behaviors.json` | Update changed statements |
| `.changeset/*.md` | Minor bump, behavior-change note |
| `tko.io` docs + `tko.io/public/agents/guide.md` | Lifecycle docs |

## Verification

1. `bunx vitest run packages/bind packages/binding.if
   packages/binding.core packages/binding.component
   packages/binding.template packages/binding.foreach` — fast loop
   while porting.
2. New specs assert the full matrix above (KO default and
   `completeOn: "render"` columns) plus #414's component scenario
   (`<!-- ko if: false -->` in a component template →
   `koDescendantsComplete` fires).
3. `bun run verify` before every commit (full suite, real-browser
   matrix is authoritative).
4. Backwards-compat sweep: `builds/knockout` specs green — this is the
   legacy surface consumers of `@tko/build.knockout` rely on.
5. Adversarial review per AGENTS.md on each in-scope commit; audit
   line in the commit message.

## Risks / open questions

- **Timing semantics.** KO fires these events synchronously; TKO's
  promise path resolves in microtasks. Existing TKO specs (and
  downstream code) may assume the async timing for
  `descendantsComplete` on nodes with async descendants. Decide and
  document: event fires synchronously when the completing notification
  is synchronous, later otherwise — same as KO.
- **Re-firing is a behavior change.** In TKO today `descendantsComplete`
  fires at most once; after this plan it fires once *per content
  cycle* (KO semantics). Consumers who attached one-shot callbacks see
  extra calls. Changeset must state this loudly.
- **`completeOn` as a reserved key.** Any userland binding named
  `completeOn` would now collide. KO has the same reservation; note it
  in docs.
- **JSX path.** `JsxObserver`-rendered component templates bypass parts
  of `applyBindingsToDescendants`; verify the async context still
  completes there (component spec has JSX cases).
- **`with` binding uses the same base class** — false branch (`with:
  null`) gets the same new notification; check its specs for
  assumptions.
