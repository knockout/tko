import fs from 'fs/promises'
import path from 'path'

const [, , tempDirArg] = process.argv
const tempDir = tempDirArg || '.dts-tmp'
const packagesDir = 'packages'

const getPackageNames = async () => {
  const entries = await fs.readdir(packagesDir, { withFileTypes: true })
  return entries.filter(entry => entry.isDirectory()).map(entry => entry.name)
}

const pathExists = async p => {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

const copyDeclarations = async packageName => {
  const targetDir = path.join(packagesDir, packageName, 'types')
  const emittedDir = path.join(tempDir, packagesDir, packageName)

  await fs.rm(targetDir, { recursive: true, force: true })
  await fs.mkdir(targetDir, { recursive: true })

  if (!(await pathExists(emittedDir))) {
    return false
  }

  await fs.cp(emittedDir, targetDir, { recursive: true })
  return true
}

const packageNames = await getPackageNames()
let written = 0

for (const packageName of packageNames) {
  const hasDeclarations = await copyDeclarations(packageName)
  if (hasDeclarations) written++
}

console.info(`Synced declaration files to ${written}/${packageNames.length} package types directories.`)
