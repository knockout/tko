/**
 * Shared build script for all TKO packages.
 *
 * Reads package.json from cwd() for name, version, and optional tko config.
 * Runs esbuild to produce ESM, CJS, MJS, and/or browser bundles.
 *
 * Usage: bun ../../tools/build.ts (from a package directory)
 */
import { execSync } from 'node:child_process'
import { readFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const name = pkg.name as string
const version = pkg.version as string
const banner = `// ${name} 🥊 ${version}`
const tko = pkg.tko || {}
const buildMode = tko.buildMode || 'default'
const iifeGlobalName = tko.iifeGlobalName || 'tko'

function run(cmd: string) {
  console.log(`[build] ${name} → ${cmd.split('--outfile=')[1] || cmd.split('--outdir=')[1] || ''}`)
  execSync(`bunx esbuild ${cmd}`, { stdio: 'inherit' })
}

function findSources(): string[] {
  const sources: string[] = []
  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(join(dir, entry.name))
      else if (entry.name.endsWith('.ts')) sources.push(join(dir, entry.name))
    }
  }
  walk('src')
  return sources
}

if (!existsSync('dist')) mkdirSync('dist', { recursive: true })

const common = `--log-level=warning --define:BUILD_VERSION='"${version}"' --sourcemap=external`

if (buildMode === 'default') {
  // ESM — all source files to dist/
  const sources = findSources().join(' ')
  run(`${sources} --platform=neutral --banner:js="${banner} ESM" ${common} --outdir=dist/`)

  // MJS — single entry point
  run(`src/index.ts --platform=neutral --banner:js="${banner} MJS" ${common} --outfile=dist/index.mjs`)

  // CJS — bundled, @tko/* external
  run(`./index.ts --platform=neutral --target=es6 --format=cjs --bundle --banner:js="${banner} CommonJS" ${common} --outfile=dist/index.cjs --external:@tko/*`)
} else if (buildMode === 'browser-only') {
  if (!existsSync('meta')) mkdirSync('meta', { recursive: true })

  const footer = `(typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : global).${iifeGlobalName} = ${iifeGlobalName}.default`
  const iifeCommon = `--platform=browser --target=es6 --format=iife --global-name=${iifeGlobalName} --bundle --banner:js="${banner} IIFE" --footer:js="${footer}" ${common}`

  // Minified
  run(`./src/index.ts ${iifeCommon} --minify --outfile=dist/browser.min.js --metafile=meta/browser_min_meta.json`)

  // Unminified
  run(`./src/index.ts ${iifeCommon} --outfile=dist/browser.js --metafile=meta/browser_meta.json`)
} else {
  console.error(`Unknown buildMode: ${buildMode}`)
  process.exit(1)
}
