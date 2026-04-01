# Plan: TKO 5.0 as an Agent-First Modern Reference Release

TKO 5.0 should make the current modern path official instead of continuing to balance two equal identities. The release should center on `@tko/build.reference`, freeze `@tko/build.knockout` on the 4.x line, and define TKO as a zero-runtime-dependency, browser-native, AI-friendly reactive UI framework with a fast path from idea to verified behavior.

The goal is not to add novelty AI features around the framework. It is to make TKO unusually legible to both humans and agents by reducing legacy ambiguity, simplifying the product story, and tightening the development and verification loop.

## Why 5.0 Exists Now

TKO already contains most of the ingredients for a sharper 5.0 direction:

- the reference build already reads as the modern path
- the repository already frames TKO as zero-runtime-dependency software
- the agent docs, verified behaviors, and browser-native TSX flows already exist
- the biggest remaining drag is historical ambiguity rather than missing capability

4.0 is the right place to stabilize and publish the current architecture. 5.0 is the right place to declare a center of gravity: one canonical build, one primary docs path, one clearer standard for how TKO is authored, tested, documented, and verified.

## Core Product Stance

TKO 5.0 should optimize first for modern builders, especially AI-assisted and agentic workflows, without giving up the framework's existing strengths in modularity, explicit state-to-DOM contracts, and zero-runtime-dependency discipline.

In practice, that means treating `@tko/build.reference` as the canonical package, keeping `@tko/build.knockout` on the 4.x line, preferring standardized modern JavaScript and native browser APIs, protecting the no-new-runtime-dependencies rule, and treating agent-facing docs plus verified behaviors as part of the product contract. High-OODA development matters: contributors should be able to move quickly from prompt or spec to executable example to focused verification.

This makes TKO 5.0 less about a rewrite and more about removing uncertainty about what the project is for and how it should be used.

## Major Changes

### 1. Make the reference build the only first-class 5.0 build

5.0 should stop presenting the reference build and the Knockout compatibility build as equal answers to the same question.

- `@tko/build.reference` becomes the default install, default documentation target, and default recommendation in all product messaging
- `@tko/build.knockout` stays maintained on 4.x with explicit support boundaries, but it is no longer positioned as a co-equal future-facing build
- new examples, docs, and feature work should target the reference build unless there is a specific compatibility reason not to

### 1.1 Version the docs experience around the release line

The docs site should stop asking the top-level reader to choose between historical and modern product stories.

- top-level `tko.io/` becomes the canonical TKO 5 documentation experience
- the current TKO 4 documentation moves under `tko.io/4/`
- TKO 4 docs should be sourced from a long-lived `v4` branch rather than kept interleaved with v5 docs in the same working tree
- the GitHub Pages deploy process should assemble the published site by building v5 from `main` and v4 from the `v4` branch, then publishing a combined artifact with v4 rooted at `/4`
- old unversioned v4-oriented documentation URLs should redirect into `/4/...` during the transition

This keeps v5 free to speak clearly in the singular while preserving a stable, versioned place for migration and compatibility guidance.

### 2. Preserve zero-runtime-dependency discipline

TKO already operates very close to true runtime zero-dependency status. 5.0 should protect that property aggressively.

- do not add new runtime dependencies to core packages or builds
- prefer native platform features over helper libraries where practical
- treat any remaining runtime-support dependencies as exceptions that must earn their place

The real dependency reduction opportunity in 5.0 is likely to be in development and testing tooling, not in the runtime surface itself.

### 3. Modernize around standard JavaScript and browser-native patterns

TKO 5.0 should lean into the strengths already visible in the reference build:

- ESM-first usage and distribution
- CSP-safe parsing and provider-driven binding evaluation
- native DOM and event paths by default
- native-provider and TSX-based authoring for modern browser-native UI development
- removal of historical special cases that exist primarily to preserve older Knockout expectations

The standard should be clear: modern JavaScript first, compatibility second.

### 4. Treat agent-facing documentation as a public interface

TKO is unusually well-positioned for AI-assisted development because its core abstractions are explicit and testable. 5.0 should make that an intentional product advantage.

- `llms.txt` should advertise the modern canonical path
- the agent guide should remain concise and code-first
- verified behaviors should serve as machine-readable behavioral truth
- the agent testing guide should document fast, focused verification flows

The flagship AI workflow for 5.0 is not "chat with TKO." It is "spec to verified behavior" with minimal ambiguity.

## Test And OODA Strategy

5.0 should improve development speed and verification confidence without turning the release into a tooling rewrite project.

The testing strategy should be:

- standardize on one primary behavior authoring style
- keep runner migration incremental rather than making it the gating item for 5.0
- preserve coverage while reducing the cognitive overhead of mixed legacy and modern test patterns
- expand fast browser-level verification where it improves confidence, especially for docs and playground-style examples

This implies a layered approach:

1. unify the style and shape of behavior tests
2. keep existing coverage intact during migration
3. adopt additional runners or browser-verification tools only when they improve the OODA loop

The release should not be blocked on a full runner rewrite. If existing work is already moving tests toward a more unified style, 5.0 should benefit from that momentum without depending on total completion.

## Migration Approach

TKO 5.0 should make a clean product decision without forcing a harsh user experience.

The migration posture should be documentation-first:

- ship a strong migration guide for Knockout-style and older TKO users moving to the reference build
- publish a clear compatibility matrix that explains which path stays on 4.x and which path moves to 5.0
- use before-and-after examples to show modern equivalents for legacy build choices and authoring patterns
- keep migration help focused on guides, examples, and explicit support boundaries rather than on a long-lived compatibility layer
- align the docs with that posture by treating `/4/` as the preserved TKO 4 reference and `/` as the v5 canonical path

This keeps the release honest. The break is real, but the path forward is well lit.

## Acceptance Criteria

TKO 5.0 is ready as a direction when the following statements are true:

- there is one obvious answer to "which TKO build should I use?" and it is `@tko/build.reference`
- the legacy Knockout build has a clearly documented 4.x maintenance position
- no new runtime dependencies have been introduced for the 5.0 line
- the human docs path and the agent docs path tell the same story
- the published docs have a clear version boundary: v5 at `/` and v4 preserved at `/4/`
- verified behaviors and agent-facing docs are maintained as part of the public contract
- contributors can move from idea to example to focused verification without navigating multiple historical product paths
- migration guidance is strong enough that the clean break feels intentional instead of abrupt

## Assumptions And Defaults

- keep the canonical package identity as `@tko/build.reference` for 5.0 rather than introducing a package rename during the same release
- prefer migration guides and compatibility documentation over shipping a long-lived compatibility layer
- continue test modernization incrementally and do not make a complete runner replacement a hard prerequisite for 5.0
- use the docs deployment pipeline to assemble a versioned published site rather than forcing v4 and v5 to coexist as one undifferentiated docs tree
- treat this document as a north-star product plan, not a fully sequenced execution program
