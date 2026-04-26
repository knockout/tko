import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const siteRoot = path.resolve(scriptDir, '..')
const repoRoot = path.resolve(siteRoot, '..')
const packagesRoot = path.join(repoRoot, 'packages')
const outputDir = path.join(siteRoot, 'public', 'agents', 'verified-behaviors')
const curatedFilename = 'verified-behaviors.json'

const generatedNotice = '> Generated from package discovery + curated JSON. Unit-test-backed only.'

const STATUS = {
  CURATED: 'curated',
  NEEDS_CURATION: 'tests-present-needs-curation',
  NO_TESTS: 'no-tests-found'
}

function renderSpecs(specs) {
  return specs.map(spec => `\`${spec}\``).join(', ')
}

function renderBehavior(behavior) {
  const lines = [`- ${behavior.statement}`]
  if (behavior.notes?.length) {
    lines.push(`  Notes: ${behavior.notes.join(' ')}`)
  }
  lines.push(`  Specs: ${renderSpecs(behavior.specs)}`)
  return lines.join('\n')
}

function slugFromPackageDir(packageDir) {
  return packageDir.replaceAll('.', '-')
}

function titleFromPackageDir(packageDir) {
  return `@tko/${packageDir}`
}

async function readPackageDescription(packageDir) {
  const packageJsonPath = path.join(packagesRoot, packageDir, 'package.json')

  try {
    const raw = await fs.readFile(packageJsonPath, 'utf8')
    const parsed = JSON.parse(raw)
    return parsed.description ?? ''
  } catch {
    return ''
  }
}

function renderPackage(pkg) {
  const curatedPath = pkg.curatedRelativePath ?? pkg.expectedCuratedRelativePath

  return [
    `# Verified Behaviors: ${pkg.title}`,
    '',
    generatedNotice,
    '',
    pkg.description,
    '',
    ...(pkg.behaviors.length
      ? ['## Behaviors', '', ...pkg.behaviors.map(renderBehavior)]
      : pkg.hasTests
        ? [`Add curated entries backed by unit tests to \`${pkg.expectedCuratedRelativePath}\`.`]
        : ['Add tests first, then curate.']),
    '',
    `_Curated source: \`${curatedPath}\`_`,
    ''
  ].join('\n')
}

function renderIndex(packages) {
  return [
    '# Verified Behaviors Index',
    '',
    generatedNotice,
    '',
    ...packages.map(pkg => `- [${pkg.title}](./${pkg.slug}.md) — ${pkg.indexDescription}`),
    ''
  ].join('\n')
}

async function assertCuratedPackageIsValid(pkg) {
  for (const behavior of pkg.behaviors) {
    if (!behavior.specs?.length) {
      throw new Error(`Behavior "${behavior.statement}" in ${pkg.packageDir} is missing specs`)
    }

    for (const spec of behavior.specs) {
      const specPath = path.join(repoRoot, spec)
      try {
        await fs.access(specPath)
      } catch {
        throw new Error(`Missing spec reference: ${spec}`)
      }
    }
  }
}

async function getAllPackageDirs() {
  const entries = await fs.readdir(packagesRoot, { withFileTypes: true })
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort((a, b) => a.localeCompare(b))
}

async function readCuratedPackage(packageDir) {
  const curatedPath = path.join(packagesRoot, packageDir, curatedFilename)

  try {
    const raw = await fs.readFile(curatedPath, 'utf8')
    return {
      data: JSON.parse(raw),
      curatedRelativePath: `packages/${packageDir}/${curatedFilename}`
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return { data: null, curatedRelativePath: null }
    }
    throw error
  }
}

async function hasSpecFiles(packageDir) {
  const specDir = path.join(packagesRoot, packageDir, 'spec')

  try {
    const entries = await fs.readdir(specDir, { withFileTypes: true })
    const hasTests = entries.some(
      entry => entry.isFile() && /\.(?:[cm]?[jt]s|tsx|jsx)$/.test(entry.name)
    )
    return { hasTests, specDirRelative: `packages/${packageDir}/spec` }
  } catch {
    return { hasTests: false, specDirRelative: `packages/${packageDir}/spec` }
  }
}

async function buildPackages(allPackageDirs) {
  const packages = []

  for (const packageDir of allPackageDirs) {
    const { data: curated, curatedRelativePath } = await readCuratedPackage(packageDir)
    const { hasTests, specDirRelative } = await hasSpecFiles(packageDir)
    const packageDescription = await readPackageDescription(packageDir)
    const status = curated ? STATUS.CURATED : hasTests ? STATUS.NEEDS_CURATION : STATUS.NO_TESTS
    const title = titleFromPackageDir(packageDir)
    const description =
      curated?.description
      ?? packageDescription
      ?? ''

    const pkg = {
      packageDir,
      slug: slugFromPackageDir(packageDir),
      title,
      description: description || `Verified behaviors for ${title}.`,
      indexDescription: description || `Verified behaviors for ${title}.`,
      whenToRead: curated?.whenToRead ?? '',
      behaviors: curated?.behaviors ?? [],
      hasTests,
      specDirRelative,
      status,
      curatedRelativePath,
      expectedCuratedRelativePath: `packages/${packageDir}/${curatedFilename}`
    }

    if (pkg.behaviors.length) {
      await assertCuratedPackageIsValid(pkg)
    }

    packages.push(pkg)
  }

  return packages
}

function warnForPackagesNeedingCuration(packages) {
  const needsCuration = packages.filter(pkg => pkg.status === STATUS.NEEDS_CURATION)
  if (!needsCuration.length) return

  console.warn('[verified-behaviors] Tests exist but verified behaviors are not curated yet:')
  for (const pkg of needsCuration) {
    console.warn(`- ${pkg.title} (${pkg.specDirRelative})`)
  }
}

const allPackageDirs = await getAllPackageDirs()
const packages = await buildPackages(allPackageDirs)
warnForPackagesNeedingCuration(packages)
await fs.mkdir(outputDir, { recursive: true })

await Promise.all(
  packages.map(pkg => fs.writeFile(path.join(outputDir, `${pkg.slug}.md`), renderPackage(pkg), 'utf8'))
)

await fs.writeFile(path.join(outputDir, 'index.md'), renderIndex(packages), 'utf8')
