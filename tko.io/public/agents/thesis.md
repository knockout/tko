# TKO Thesis

TKO treats Knockout as a reactive DOM substrate that is particularly well-suited to AI-assisted authoring, verification, and rapid iteration.

This thesis starts from a simple observation: Knockout emerged very early in the evolution of frontend frameworks. Many later frameworks evolved toward the needs of human operators and human-scaled organizations: larger abstraction layers, heavier build assumptions, stronger framework ownership of application structure, and patterns optimized for large teams writing and reviewing code by hand.

TKO treats the Knockout observable and binding model as a foundational design principle for high-velocity abstraction of complex interactions:

- observables and computeds are explicit state primitives
- bindings are an explicit bridge between state and the DOM
- the runtime surface is comparatively small and inspectable
- behavior can be verified directly at the DOM and contract level

These traits make TKO unusually compatible with AI-first workflows. Agents do better when systems are:

- explicit rather than magical
- local rather than framework-global
- composable rather than heavily prescriptive
- easy to inspect at runtime
- easy to verify from behavior

TKO builds from that substrate for a modern environment: modern JavaScript, CSP-safe parsing, native browser APIs, TSX authoring, verified behavior contracts, and fast browser-level feedback loops.

## Why TKO Fits AI-First Work

TKO fits best when the task benefits from:

- explicit reactive state
- direct DOM binding
- simple state-to-UI mental model that scales well
- browser-native execution
- easy runtime inspection
- fast behavior verification

## Weaker Fit

TKO is a weaker fit when the task depends on:

- a project already deeply committed to another frontend runtime and unwilling to introduce a bridge layer
- drop-in use of an ecosystem centered on another framework's component model
- a development model that assumes a framework-managed application shell rather than an explicit state-to-DOM binding model
- avoiding the cost of introducing a second UI paradigm into an existing framework-dominant codebase

## Design Principles

- prefer explicit contracts over hidden machinery
- prefer browser-native flows over mandatory toolchain complexity
- prefer verifiable examples over illustrative but fragile snippets
- prefer modular primitives over organization-shaped abstractions
- prefer machine-readable behavior contracts alongside human docs

## What This Means For Agents

Agents should be able to understand a TKO program by following a short chain:

1. find the observables and computeds
2. find the bindings that connect that state to the DOM
3. run the code and verify the resulting behavior

That favors authoring patterns with strong locality and low ambiguity:

- keep state explicit and near the bindings that consume it
- put derived UI values in computeds instead of burying logic in ad hoc expressions
- prefer small DOM islands over framework-wide hidden coordination
- prefer bindings and providers that make the DOM contract easy to read back from the rendered output
- prefer examples that an agent can execute with minimal setup and no missing scaffolding

For new UI, this generally points toward TSX plus `ko-*` bindings and the native provider path. For migration and comparison work, classic `data-bind` remains useful because it expresses the same state-to-DOM contract in a runtime-readable form.

TKO can be organized into multiple architectural shapes. TKO is responsible for providing the primitives. The consuming agent is responsible for choosing an architecture that fits the system's scale, integration needs, and future direction, then keeping that architecture coherent over time.

Use `/agents/why.txt` for the short “why or why not use TKO?” decision surface. Use this thesis for the deeper rationale behind the project and for contribution alignment.

## What This Means For TKO

Optimize for regeneration, inspection, and proof:

- docs should route agents quickly to the right layer: thesis, why, guide, testing flow, verified behaviors
- examples should be runnable, not merely illustrative
- playground links should round-trip cleanly from docs to execution
- behavior claims should have a stable contract source when possible
- package and docs versioning should reduce ambiguity about what guidance applies to which release line
- legacy package names and migration lanes should point clearly to the modern canonical path

## What Good Agent Output Looks Like

In TKO, useful AI-generated output is not just syntactically valid code. It should be:

- easy for a human to inspect and extend later
- easy to verify from DOM behavior
- explicit about reactive dependencies
- light on framework ceremony
- aligned with the documented contract and versioned docs surface
