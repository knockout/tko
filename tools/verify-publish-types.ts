#!/usr/bin/env bun
import { Glob } from 'bun'

const buildWorkspaces = ['builds/knockout', 'builds/reference']
const packageWorkspaces: string[] = []
const rootBinDir = `${process.cwd()}/node_modules/.bin`
const publintBin = `${rootBinDir}/publint`
const attwBin = `${rootBinDir}/attw`

for await (const manifest of new Glob('packages/*/package.json').scan('.')) {
  packageWorkspaces.push(manifest.replace('/package.json', ''))
}

const workspaces = [...packageWorkspaces.sort(), ...buildWorkspaces].sort()

const WORKSPACES_EXPECTED_COUNT = 27
if (workspaces.length !== WORKSPACES_EXPECTED_COUNT) {
  throw new Error(`Expected ${WORKSPACES_EXPECTED_COUNT} publishable workspaces, found ${workspaces.length}`)
}

async function dirHasFiles(dir: string) {
  for await (const _file of new Glob('**/*').scan(dir)) {
    return true
  }

  return false
}

async function run(command: string[], cwd: string, label: string) {
  console.log(`[verify:publish-types] ${cwd} :: ${label}`)

  const proc = Bun.spawn(command, {
    cwd,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit'
  })

  const exitCode = await proc.exited
  if (exitCode !== 0) {
    throw new Error(`${cwd} failed ${label}`)
  }
}

for (const workspace of workspaces) {
  const manifest = await Bun.file(`${workspace}/package.json`).json()
  if (manifest.private) {
    continue
  }

  if (!(await dirHasFiles(`${workspace}/dist`))) {
    throw new Error(`${manifest.name} has no dist output`)
  }

  if (!(await dirHasFiles(`${workspace}/types`))) {
    throw new Error(`${manifest.name} has no types output`)
  }

  await run(['npm', 'pack', '--dry-run'], workspace, 'npm pack --dry-run')
  await run([publintBin, '.'], workspace, 'publint')
  await run([attwBin, '--pack', '.'], workspace, 'attw --pack')
}

console.log('All packages pass publish/type verification.')
