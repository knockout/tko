/**
 * A simple utility for ensuring that the contents of
 * the package.json files are consistent and it is
 * easy to distribute changes.
 */
import fs from 'fs/promises'

const LERNA_CONF = '../../lerna.json'

const hasDir = (name) =>
  fs.access(name).then(() => true, () => false)

const packageData = (pkg, version, hasHelpers) => ({
  version: version,
  ...pkg,
  // Common
  standard: undefined,
  exports: {
    ".": {
      types: "./types/index.d.ts",
      require: "./dist/index.cjs",
      import: "./dist/index.js"
    },
    ...(hasHelpers && { "./helpers/*": "./helpers/*" })
  },
  files: [
    "dist/",
    ...(hasHelpers ? ["helpers/"] : []),
    "types/"
  ],
  homepage: "https://tko.io",
  licenses: [
    {
      type: "MIT",
      url: "https://opensource.org/licenses/MIT"
    }
  ],
  bugs: {
    url: "https://github.com/knockout/tko/issues"
  },
  author: "The Knockout Team",
  repository: {
    type: "git",
    url: "git+https://github.com/knockout/tko.git"
  },
})

const parse = async n => JSON.parse(await fs.readFile(n, 'utf8'))

const version = (await parse(LERNA_CONF)).version
const pkg = await parse('package.json')
const hasHelpers = await hasDir('helpers')
console.info(`Rewriting package.json: ${pkg.name}.`)
const data = packageData(pkg, version, hasHelpers)
fs.writeFile('package.json', JSON.stringify(data, null, 2), 'utf8')
  .catch(console.error)
