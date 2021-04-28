#!node
/**
 * A simple utility for updating the package.json files with
 * some dynamics when we re-release.
 */
import fs from 'fs/promises'

const packageData = (pkg, version) => ({
  name: pkg.name,
  description: pkg.description,
  version: version,
  karma: pkg.karma,
  // Common
  standard: {
		env: [
			"browser",
			"jasmine",
			"mocha"
		]
  },
  exports: {
    require: "./dist/index.js",
    import: "./dist/index.mjs"
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

const version = process.argv[2]
if (!version) {
  throw new Error('Bad version: ', version)
}
const pkg = await fs.readFile('package.json', 'utf8').catch(() => '{}')
const data = packageData(JSON.parse(pkg), version)
fs.writeFile('package.json', JSON.stringify(data, null, 2), 'utf8')
  .catch(console.error)
