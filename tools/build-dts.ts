#!/usr/bin/env bun
import { $, Glob } from 'bun'

const tempOutDir = '.dts-tmp/emit'
const buildWorkspaces = ['builds/knockout', 'builds/reference']
const packageWorkspaces: string[] = []
// These entrypoints publish a package-level default export, but their CommonJS
// runtime shape is module.exports = value rather than { default: value }.
const cjsEntrypointsNeedingExportEquals = new Set(['builds/knockout', 'builds/reference', 'packages/utils.component'])

function hasKnownExtension(specifier: string) {
  return /\.(?:[cm]?js|json|[cm]?ts|tsx|jsx)$/i.test(specifier)
}

function rewriteRelativeModuleSpecifiers(source: string, extension: '.mjs' | '.cjs') {
  const rewrite = (_match: string, prefix: string, specifier: string, suffix: string) => {
    if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
      return `${prefix}${specifier}${suffix}`
    }
    if (hasKnownExtension(specifier)) {
      return `${prefix}${specifier}${suffix}`
    }
    return `${prefix}${specifier}${extension}${suffix}`
  }

  return source
    .replace(/(from\s+['"])(\.\.?\/[^'"]+)(['"])/g, rewrite)
    .replace(/(import\s+['"])(\.\.?\/[^'"]+)(['"])/g, rewrite)
    .replace(/(import\(\s*['"])(\.\.?\/[^'"]+)(['"]\s*\))/g, rewrite)
}

function toCjsDeclaration(source: string, workspace: string, declarationPath: string) {
  const rewritten = rewriteRelativeModuleSpecifiers(source, '.cjs')

  if (
    declarationPath === 'index.d.ts' &&
    cjsEntrypointsNeedingExportEquals.has(workspace) &&
    rewritten.includes('export default _default;')
  ) {
    return rewritten.replace('export default _default;', 'export = _default;')
  }

  return rewritten
}

for await (const manifest of new Glob('packages/*/package.json').scan('.')) {
  packageWorkspaces.push(manifest.replace('/package.json', ''))
}

const workspaces = [...packageWorkspaces.sort(), ...buildWorkspaces].sort()

const WORKSPACES_EXPECTED_COUNT = 27
if (workspaces.length !== WORKSPACES_EXPECTED_COUNT) {
  throw new Error(`Expected ${WORKSPACES_EXPECTED_COUNT} publishable workspaces, found ${workspaces.length}`)
}

await $`rm -rf ${tempOutDir}`.quiet()
await $`bunx tsc -p tsconfig.dts.json`

for (const workspace of workspaces) {
  const emittedTypesDir = `${tempOutDir}/${workspace}/src`
  const packageTypesDir = `${workspace}/types`
  const indexDeclaration = `${emittedTypesDir}/index.d.ts`
  const result = await $`test -f ${indexDeclaration}`.nothrow().quiet()

  if (result.exitCode !== 0) {
    throw new Error(`Missing declaration entry for ${workspace}: ${indexDeclaration}`)
  }

  await $`rm -rf ${packageTypesDir}`.quiet()
  await $`mkdir -p ${packageTypesDir}`.quiet()
  await $`cp -R ${emittedTypesDir}/. ${packageTypesDir}/`.quiet()

  const declarationGlob = new Glob('**/*.d.ts')
  for await (const declarationPath of declarationGlob.scan(packageTypesDir)) {
    const declarationFile = `${packageTypesDir}/${declarationPath}`
    const declarationSource = await Bun.file(declarationFile).text()
    const esmFile = declarationFile.replace(/\.d\.ts$/, '.d.mts')
    const cjsFile = declarationFile.replace(/\.d\.ts$/, '.d.cts')

    await Bun.write(esmFile, rewriteRelativeModuleSpecifiers(declarationSource, '.mjs'))
    await Bun.write(cjsFile, toCjsDeclaration(declarationSource, workspace, declarationPath))
  }
}

await $`rm -rf ${tempOutDir}`.quiet()
