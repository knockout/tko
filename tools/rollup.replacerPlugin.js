/**
 * Resolve the path of @tko/* packages, so
 *
 *    @tko/utils   =>   packages/utils/src/index.js
 *
 * We use sources so that we don't have multiple references
 * from different sources e.g. `@tko/computed` and `@tko/observable`
 * both importing `@tko/utils` would generate multiple versions
 * of objectMap that rollup transpiles as objectMap$1 and
 * objectMap$2.
 *
 * Plus by doing this we won't need to rebuild dist/ files
 * whenever we make changes to the source.
 */

const fs = require('fs-extra')
const path = require('path')

const PACKAGES_PATH = path.join(__dirname, '..', 'packages')

module.exports = {
  name: 'tko-package-imports',
  resolveId (importee, importer) {
    if (importee.includes('/') && !importee.includes('@tko')) { return }
    importee = importee.replace('@tko/', '')
    const packagePath = path.join(PACKAGES_PATH, importee, 'src/index.js')
    return fs.existsSync(packagePath) ? packagePath : null
  }
}
