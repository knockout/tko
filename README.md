# TKO ("Technical Knockout")

[![npm version](https://badge.fury.io/js/@tko%2Fbuild.reference.svg)](https://badge.fury.io/js/@tko%2Fbuild.reference)
[![Check Tests](https://github.com/knockout/tko/actions/workflows/test-headless.yml/badge.svg)](https://github.com/knockout/tko/actions/workflows/test-headless.yml)
[![Lint & Typecheck](https://github.com/knockout/tko/actions/workflows/lint-and-typecheck.yml/badge.svg)](https://github.com/knockout/tko/actions/workflows/lint-and-typecheck.yml)

Modern successor to [Knockout.js](https://knockoutjs.com). Reactive data binding and UI templating with zero runtime dependencies.

Knockout applications written over a decade ago are still running in production. TKO gives them a path forward — swap the script tag, verify your tests pass, then optionally adopt modern features like TSX, native providers, and modular packages.

## Quick start

```html
<script src="https://cdn.jsdelivr.net/npm/@tko/build.knockout/dist/browser.min.js"></script>
```

Or as an ES module:

```html
<script type="module">
  import ko from 'https://esm.run/@tko/build.knockout'
</script>
```

Or via a package manager:

```sh
npm install @tko/build.knockout
```

**[Full documentation at tko.io](https://tko.io)**

## Builds

| Package | Description |
|---------|-------------|
| `@tko/build.knockout` | Knockout-compatible build. Start here for migrations. |
| `@tko/build.reference` | Modern build with TSX, `ko-*` attributes, native provider, strict equality. |

## Development

| Command | Description |
|---------|-------------|
| `bun install` | Install dependencies |
| `bun run build` | Build all packages |
| `bun run test` | Run tests (Vitest, headless Chromium) |
| `bun run verify` | Full check: lint + typecheck + build + test |
| `bun run knip` | Detect unused code and dependencies |
| `bun run check` | Biome lint + format |

See [AGENTS.md](AGENTS.md) for full contributor instructions.

## Architecture

27 modular `@tko/*` packages, two bundled builds. TypeScript source, esbuild compilation, Bun workspaces.

The core model: observables notify subscribers when they change. Bindings subscribe to observables and update the DOM. No virtual DOM, no diffing — updates are proportional to what changed, not tree size.

See [agents/soul.md](https://tko.io/agents/soul.md) for the design philosophy.

## Direction

TKO is moving toward an AI-maintained "dark factory" model — where the tooling, tests, and documentation are robust enough that AI agents can handle routine maintenance autonomously. See [plans/dark-factory.md](plans/dark-factory.md).

## License

MIT — [opensource.org/licenses/MIT](https://opensource.org/licenses/MIT)

## Credits

[Steve Sanderson](https://github.com/SteveSanderson) (Knockout creator), [Michael Best](https://github.com/mbest), and [contributors](https://github.com/knockout/tko/graphs/contributors).
