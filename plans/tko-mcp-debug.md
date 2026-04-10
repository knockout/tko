# Plan: TKO Debug Runtime and MCP Bridge

**Goal**: Add a TKO-native debugging surface for live apps and expose it to AI
agents through MCP, starting with DOM-to-viewmodel inspection and observable
tracing.

---

## Current State

- TKO already exposes the core runtime primitives needed for inspection:
  `dataFor(node)`, `contextFor(node)`, binding contexts, observables,
  subscribables, computeds, and extenders
- Agent-facing docs already exist in `tko.io/public/agent-guide.md` and
  `tko.io/public/agent-testing.md`
- The repo has no dedicated browser debug package and no MCP server package
- Existing debugging is mostly ad hoc: console access, spec repros, and
  runtime helpers used directly by humans

## Opportunity

TKO can support a stronger AI and developer workflow than generic browser
automation alone by exposing framework-aware runtime tools:

- inspect a DOM node and recover the bound view model/context
- identify which observables and computeds are driving a UI region
- trace observable writes and notifications
- explain why a binding resolved to a particular value
- capture a minimal repro for the playground or a spec

This is especially valuable for:

- debugging incorrect DOM output
- investigating missing or excessive reactivity
- understanding binding-context resolution
- teaching agents how live TKO apps are actually behaving, not just how source
  code appears to be written

---

## Desired Outcome

Two complementary packages:

### `@tko/debug`

Browser/runtime package that understands TKO internals and exposes safe,
framework-aware inspection hooks. This package should be reusable outside MCP,
including in the docs playground, tests, and future browser tooling.

### `@tko/mcp`

Node-side MCP server package that talks to a live page using the debug bridge
from `@tko/debug` and turns that information into agent tools.

---

## Package Boundaries

### `@tko/debug` responsibilities

- DOM inspection built on `dataFor(node)` and `contextFor(node)`
- binding-context serialization:
  `$data`, `$rawData`, `$parent`, `$parents`, `$root`, aliases, context chain
- observable and computed inspection:
  current value preview, subscriber counts, dependency counts, active/sleeping
  state, extender-related flags where available
- temporary tracing hooks for subscribables and computeds
- safe serialization and preview helpers for cyclic graphs and large objects
- optional bridge registration such as `attachDebugBridge(windowLike)`

### `@tko/debug` non-goals

- no MCP transport logic
- no dependency on browser automation tooling
- no required production overhead for apps that do not opt in
- no new runtime dependency for core packages

### `@tko/mcp` responsibilities

- MCP server entrypoint and tool registration
- connection to a browser session or playground page
- invoking the `@tko/debug` bridge inside the page
- validating tool inputs and shaping tool outputs for agents
- optional helpers that turn inspections into playground repros or spec seeds

### `@tko/mcp` non-goals

- no direct knowledge of internal TKO state without going through
  `@tko/debug`
- no duplication of runtime inspection logic
- no requirement that normal TKO applications ship MCP code

---

## Design Principles

1. Keep the runtime bridge small and explicit.
   Prefer a narrow, documented debug surface over broad monkeypatching.

2. Make deep tracing opt-in.
   Basic inspection should be cheap. More expensive instrumentation should be
   enabled only when requested.

3. Preserve core package stability.
   The implementation should avoid invasive changes to shared runtime code
   unless a hook is clearly justified and remains dev-oriented.

4. Prefer reusable debug primitives over MCP-specific hacks.
   If a capability is useful for the MCP, it is likely also useful for tests,
   docs, or a browser console workflow.

5. Return agent-friendly summaries, not raw object dumps.
   Tool output should explain what matters and avoid flooding the agent with
   cyclic or low-signal data.

---

## Proposed Runtime Surface

Initial `@tko/debug` API:

- `inspectNode(target)`
  Returns selector/path metadata, `dataFor`, `contextFor`, and a context-chain
  summary for the target node
- `inspectObservable(target)`
  Returns current value preview, subscribable metadata, subscriber counts, and
  computed dependency information where applicable
- `traceObservable(target, options)`
  Attaches temporary instrumentation and returns a trace handle plus events
- `listBindings(target)`
  Returns binding/provider details for a bound node where recoverable
- `attachDebugBridge(globalObject)`
  Registers a stable bridge such as `globalObject.__TKO_DEBUG__`

Initial bridge methods exposed to MCP:

- `inspectNodeBySelector(selector)`
- `inspectObservableByPath(selector, path)`
- `traceObservableByPath(selector, path, options)`
- `listBindingsBySelector(selector)`
- `stopTrace(traceId)`

---

## Proposed MCP Tools

Phase 1 tools:

- `inspect_node`
  Given a selector, return the bound data/context summary for that node
- `inspect_observable`
  Given a node selector plus property path, inspect an observable/computed on
  the bound view model
- `trace_observable`
  Given a node selector plus property path, trace changes for a short session

Phase 2 tools:

- `inspect_binding_context`
- `list_bindings`
- `explain_computed`
- `capture_playground_repro`

Future tools if the first phases land well:

- `diff_node_state`
- `trace_binding_updates`
- `find_subscription_leaks`
- `explain_provider_resolution`

---

## Implementation Plan

### Phase 0: Design and constraints

- confirm package names, intended publishability, and workspace placement
- confirm whether the first version targets only browser pages or also the docs
  playground
- document the bridge contract and output-shaping rules before implementation
- decide whether to keep the bridge public API minimal and mark richer methods
  as experimental

### Phase 1: `@tko/debug` foundation

- create `packages/debug`
- implement safe serializers and preview helpers
- implement node inspection using existing binding-context runtime APIs
- implement observable/computed inspection using existing subscribable and
  computed APIs
- add a small bridge registration helper
- add focused tests for:
  - `inspectNode`
  - context-chain serialization
  - observable inspection
  - computed dependency reporting

### Phase 2: opt-in tracing

- add trace session management in `@tko/debug`
- instrument subscribable notifications in a reversible, scoped way
- expose start/stop trace APIs
- add tests covering:
  - primitive writes
  - object writes
  - computed re-evaluation visibility
  - cleanup after trace stop

### Phase 3: `@tko/mcp` minimal server

- create `packages/mcp`
- add MCP server bootstrap and tool registration
- implement a transport to evaluate bridge calls against a live page
- implement the first three tools:
  `inspect_node`, `inspect_observable`, `trace_observable`
- shape outputs for agent readability and constrained token use
- add server-level tests where practical and smoke tests against a small sample
  app or playground page

### Phase 4: docs and agent guidance

- document `@tko/debug` usage for app authors and test authors
- document the MCP tool surface and intended workflows
- update agent-facing docs to mention when MCP is available vs when direct
  playground/spec workflows are preferred
- include security and privacy notes for exposing live app state to tools

### Phase 5: richer inspection

- add binding/provider inspection
- add computed explanation helpers
- add repro capture helpers for playground URLs or spec skeletons
- evaluate whether some helpers belong in docs tooling instead of MCP

---

## Open Questions

- Should `@tko/debug` ship as a public supported package immediately, or begin
  as experimental?
- Should the first `@tko/mcp` transport target the local docs playground, a
  generic browser session, or both?
- How much binding/provider detail can be recovered without adding new runtime
  hooks?
- Do we want trace output to be pull-based, push-based, or both?
- Should repro capture emit playground payloads, spec code, or offer both
  formats?

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Debug hooks become invasive in core runtime | keep most logic in `@tko/debug`; add only narrowly justified hooks to core packages |
| Tool output becomes too noisy for agents | design explicit serializers and small summaries first |
| Tracing introduces accidental behavior changes | keep tracing opt-in, reversible, and covered by focused tests |
| MCP transport becomes tightly coupled to one browser workflow | isolate transport behind a small adapter layer |
| Scope grows too quickly | ship Phase 1 and Phase 3 before expanding into provider explanation or leak detection |

---

## Verification

- `@tko/debug` unit/spec coverage for inspection and tracing behavior
- `@tko/mcp` smoke test proving a live page can be queried for:
  - bound node data/context
  - observable metadata
  - short trace output
- manual validation against a small playground example and at least one
  package-level repro fixture
- docs verification for any new public runtime APIs or agent workflows

## Initial Success Criteria

- an agent can point at a DOM node and recover the relevant `$data` and context
- an agent can inspect a named observable/computed from a bound view model
- an agent can trace a short sequence of observable changes without altering
  app behavior
- the runtime inspection surface is useful on its own even without MCP
