/**
 * A simple utility for updating the package.json files with
 * some dynamics when we re-release.
 */
import path from 'path'
import fs from 'fs/promises'
import url from 'url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const packageData = (pkg, version) => ({
  version: version,
  ...pkg,
  // Common
  standard: undefined,
  exports: {
    ".": {
      require: "./dist/index.js",
      import: "./dist/index.mjs"
    },
    "./helpers/*": "./helpers/*"
  },
  files: [
    "dist/",
    "helpers/"
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

const version = JSON.parse(await fs.readFile(path.join(__dirname, '../lerna.json'))).version
const pkg = await fs.readFile('package.json', 'utf8').catch(() => '{}')
console.info(`Repackaged ${pkg.name} as ${version}.`)
const data = packageData(JSON.parse(pkg), version)
fs.writeFile('package.json', JSON.stringify(data, null, 2), 'utf8')
  .catch(console.error)
