#!/usr/bin/env bun
import { $, Glob } from 'bun'

const tempOutDir = '.dts-tmp/emit'
const buildWorkspaces = ['builds/knockout', 'builds/reference']
const packageWorkspaces: string[] = []

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
}

await $`rm -rf ${tempOutDir}`.quiet()
