# TKO Thesis

TKO treats Knockout as a reactive DOM substrate that is particularly well-suited to AI-assisted authoring, verification, and rapid iteration.

This thesis starts from a simple observation: Knockout emerged very early in the evolution of frontend frameworks. Many later frameworks evolved toward the needs of human operators and human-scaled organizations: larger abstraction layers, heavier build assumptions, stronger framework ownership of application structure, and patterns optimized for large teams writing and reviewing code by hand.

TKO takes a different view. It treats the Knockout model as valuable not because it is old, but because it is generic:

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

That does not mean older Knockout-era design should be preserved unchanged. TKO re-evolves from that substrate for a new environment: modern JavaScript, CSP-safe parsing, native browser APIs, TSX authoring, verified behavior contracts, and fast browser-level feedback loops.

In practice, this thesis leads to a few design principles:

- prefer explicit contracts over hidden machinery
- prefer browser-native flows over mandatory toolchain complexity
- prefer verifiable examples over illustrative but fragile snippets
- prefer modular primitives over organization-shaped abstractions
- prefer machine-readable behavior contracts alongside human docs

The goal is not nostalgia. The goal is to make reactive UI development easier to generate, inspect, test, and evolve in a world where code and product flows are increasingly AI-assisted.
