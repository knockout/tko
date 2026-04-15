#!/usr/bin/env bun
/**
 * Shared build script for all TKO packages.
 * Reads package.json for name, version, and optional tko config.
 * Usage: bun ../../tools/build.ts (from a package directory)
 */
import { $, Glob } from 'bun'

const pkg = await Bun.file('package.json').json()
const { name, version } = pkg
const banner = `// ${name} 🥊 ${version}`
const { buildMode = 'default', iifeGlobalName = 'tko' } = pkg.tko ?? {}

const common = `--log-level=warning --define:BUILD_VERSION='"${version}"' --sourcemap=external`

function esbuild(args: string) {
  console.log(`[build] ${name} → ${args.match(/--out(?:file|dir)=(\S+)/)?.[1] ?? ''}`)
  const proc = Bun.spawn(['sh', '-c', `bunx esbuild ${args}`], { stdio: ['inherit', 'inherit', 'inherit'] })
  return proc.exited.then(code => { if (code) process.exit(code) })
}

async function sources(): Promise<string> {
  const glob = new Glob('src/**/*.ts')
  const files: string[] = []
  for await (const file of glob.scan('.')) files.push(file)
  return files.join(' ')
}

await $`mkdir -p dist`.quiet()

const queued: Promise<void>[] = []

if (buildMode === 'default' || buildMode === 'browser') {
  const src = await sources()
  queued.push(
    esbuild(`${src} --platform=neutral --banner:js="${banner} ESM" ${common} --outdir=dist/`),
    esbuild(`src/index.ts --platform=neutral --banner:js="${banner} MJS" ${common} --outfile=dist/index.mjs`),
    esbuild(`./index.ts --platform=neutral --target=es6 --format=cjs --bundle --banner:js="${banner} CommonJS" ${common} --outfile=dist/index.cjs --external:@tko/*`)
  )
}

if (buildMode === 'browser') {
  await $`mkdir -p meta`.quiet()
  const footer = `(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : global).${iifeGlobalName} = ${iifeGlobalName}.default`
  const iife = `--platform=browser --target=es6 --format=iife --global-name=${iifeGlobalName} --bundle --banner:js="${banner} IIFE" --footer:js="${footer}" ${common}`
  queued.push(
    esbuild(`./src/index.ts ${iife} --minify --outfile=dist/browser.min.js --metafile=meta/browser_min_meta.json`),
    esbuild(`./src/index.ts ${iife} --outfile=dist/browser.js --metafile=meta/browser_meta.json`)
  )
}

if (buildMode !== 'default' && buildMode !== 'browser') {
  console.error(`Unknown buildMode: ${buildMode}`)
  process.exit(1)
}

await Promise.all(queued)
