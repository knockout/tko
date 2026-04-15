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

async function esbuild(args: string) {
  console.log(`[build] ${name} → ${args.match(/--out(?:file|dir)=(\S+)/)?.[1] ?? ''}`)
  const proc = Bun.spawn(['sh', '-c', `bunx esbuild ${args}`], { stdio: ['inherit', 'inherit', 'inherit'] })
  const code = await proc.exited
  if (code !== 0) process.exit(code)
}

async function sources(): Promise<string> {
  const glob = new Glob('src/**/*.ts')
  const files: string[] = []
  for await (const file of glob.scan('.')) files.push(file)
  return files.join(' ')
}

await $`mkdir -p dist`.quiet()

if (buildMode === 'default' || buildMode === 'browser') {
  const src = await sources()
  await esbuild(`${src} --platform=neutral --banner:js="${banner} ESM" ${common} --outdir=dist/`)
  await esbuild(`src/index.ts --platform=neutral --banner:js="${banner} MJS" ${common} --outfile=dist/index.mjs`)
  await esbuild(`./index.ts --platform=neutral --target=es6 --format=cjs --bundle --banner:js="${banner} CommonJS" ${common} --outfile=dist/index.cjs --external:@tko/*`)
}

if (buildMode === 'browser') {
  await $`mkdir -p meta`.quiet()
  const footer = `(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : global).${iifeGlobalName} = ${iifeGlobalName}.default`
  const iife = `--platform=browser --target=es6 --format=iife --global-name=${iifeGlobalName} --bundle --banner:js="${banner} IIFE" --footer:js="${footer}" ${common}`
  await esbuild(`./src/index.ts ${iife} --minify --outfile=dist/browser.min.js --metafile=meta/browser_min_meta.json`)
  await esbuild(`./src/index.ts ${iife} --outfile=dist/browser.js --metafile=meta/browser_meta.json`)
}

if (buildMode !== 'default' && buildMode !== 'browser') {
  console.error(`Unknown buildMode: ${buildMode}`)
  process.exit(1)
}
