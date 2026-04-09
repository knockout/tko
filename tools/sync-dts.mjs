import fs from 'fs/promises'
import path from 'path'

const [, , tempDirArg, sourceDirsArg] = process.argv
const tempDir = tempDirArg || '.dts-tmp'
const sourceRoots = sourceDirsArg ? sourceDirsArg.split(',') : ['packages', 'builds/reference']

const pathExists = async filePath => {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

const hasPackageJson = async directoryPath => pathExists(path.join(directoryPath, 'package.json'))

const countDeclarationFiles = async directoryPath => {
  if (!(await pathExists(directoryPath))) {
    return 0
  }

  let total = 0
  const pending = [directoryPath]

  while (pending.length > 0) {
    const currentPath = pending.pop()
    const entries = await fs.readdir(currentPath, { withFileTypes: true })

    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name)

      if (entry.isDirectory()) {
        pending.push(entryPath)
      } else if (entry.isFile() && entry.name.endsWith('.d.ts')) {
        total++
      }
    }
  }

  return total
}

const listTargets = async sourceRoot => {
  if (await hasPackageJson(sourceRoot)) {
    return [sourceRoot]
  }

  const entries = await fs.readdir(sourceRoot, { withFileTypes: true })
  const directories = entries.filter(entry => entry.isDirectory()).map(entry => path.join(sourceRoot, entry.name))
  const targets = []

  for (const directoryPath of directories) {
    if (await hasPackageJson(directoryPath)) {
      targets.push(directoryPath)
    }
  }

  return targets
}

const copyDeclarations = async targetPath => {
  const targetDir = path.join(targetPath, 'types')
  const emittedDir = path.join(tempDir, targetPath)

  await fs.rm(targetDir, { recursive: true, force: true })
  await fs.mkdir(targetDir, { recursive: true })

  if (!(await pathExists(emittedDir))) {
    return { copied: false, fileCount: 0 }
  }

  await fs.cp(emittedDir, targetDir, { recursive: true })
  const fileCount = await countDeclarationFiles(targetDir)
  return { copied: true, fileCount }
}

const targets = []
for (const sourceRoot of sourceRoots) {
  targets.push(...(await listTargets(sourceRoot)))
}

let written = 0
let copiedFiles = 0

for (const targetPath of targets) {
  const result = await copyDeclarations(targetPath)

  if (result.copied) {
    written++
    copiedFiles += result.fileCount
    const fileLabel = result.fileCount === 1 ? 'file' : 'files'
    console.info(`[dts] ${targetPath}: copied ${result.fileCount} .d.ts ${fileLabel}`)
  } else {
    console.info(`[dts] ${targetPath}: no emitted .d.ts files found`)
  }
}

console.info(
  `[dts] Synced ${copiedFiles} .d.ts files across ${written}/${targets.length} declaration targets.`,
)
