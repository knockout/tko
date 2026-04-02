# TKO Thesis

Use `/llms.txt` as the index for the full agent docs set. This file explains why TKO exists, what direction it follows, and what kinds of contributions align with that direction.

## Core Thesis

TKO treats the Knockout observable and binding model as a foundational design principle for building complex interactions at high velocity:

- observables and computeds are explicit state primitives
- bindings are an explicit bridge between state and the DOM
- the runtime surface is comparatively small and inspectable
- behavior can be verified directly at the DOM and contract level

TKO builds from that substrate for a modern environment: modern JavaScript, CSP-safe parsing, native browser APIs, TSX authoring, verified behavior contracts, and fast browser-level feedback loops.

## Why This Matters Now

Frontend frameworks after Knockout often specialized around the needs of human-operated organizations: stronger framework ownership of structure, deeper build pipelines, and abstractions designed around handwritten code at team scale.

TKO is not a rejection of those systems. It is a different bet.

TKO is designed to enable AI to OODA faster: observe, orient, decide, and act by keeping state, DOM wiring, and runtime behavior explicit and verifiable.

## Design Principles

- prefer explicit contracts over hidden machinery
- prefer browser-native flows over mandatory toolchain complexity
- prefer verifiable examples over illustrative but fragile snippets
- prefer modular primitives over abstractions shaped mainly by organizational overhead
- prefer machine-readable behavior contracts alongside human docs

## What This Means For Agents

Agents should be able to understand a TKO program by following a short chain:

1. find the observables and computeds
2. find the bindings that connect that state to the DOM
3. run the code and verify the resulting behavior

This favors explicit contracts, local reasoning, and examples that can be executed and verified with minimal hidden scaffolding.

## Contribution Alignment

Contributions that align with the thesis usually:

- make reactive contracts clearer
- improve runtime inspectability
- strengthen verified behavior coverage
- make examples more runnable and easier to prove
- reduce unnecessary dependency or toolchain burden
- improve migration clarity or interop with surrounding systems

Contributions that move away from the thesis usually:

- hide reactive behavior behind opaque abstractions
- add framework-owned architecture by default
- increase toolchain burden without improving verification or clarity
- multiply package, version, or docs ambiguity

TKO should continue optimizing for regeneration, inspection, and proof: runnable examples, stable behavior contracts, clear docs routing, and lower ambiguity around packages, versions, and migration paths.

## Evolutionary Analogy

In biology, early ancestors are often more general and later descendants become more specialized for a particular environment. A classic example is feathers: early feathers appear to have evolved before bird flight, likely serving functions such as insulation, communication, or water repellency, and only later became aerodynamic structures for flight. The earlier substrate was not obsolete. It became newly valuable when the environment and use case changed.

TKO treats Knockout in that way. Knockout appeared early in the evolution of frontend frameworks, before the ecosystem specialized around virtual DOMs, framework-owned application shells, and large convention-heavy toolchains. Its observable and binding model remained closer to a general reactive DOM substrate: explicit state, explicit DOM wiring, and direct behavioral verification.

Later frontend frameworks specialized for different environmental pressures: larger human organizations, heavier build systems, framework-managed application structure, and ecosystem-scale coordination. The thesis of TKO is that AI-assisted development changes the environment. Agents need systems they can inspect, regenerate, verify, and evolve directly. In that environment, Knockout's earlier observable-and-binding substrate becomes newly fit for the same reason early feathers did: a general structure developed under one set of pressures becomes newly fit under another.
