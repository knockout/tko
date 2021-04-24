/**
 * A simple script to return the peer @tko dependencies of the current package.
 */
import path from 'path'
import fs from 'fs'

const pkg_path = path.join(process.cwd(), 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkg_path))

const deps = Object.keys(pkg.dependencies)
  .filter(v => v.startsWith('@tko/'))
  .map(r => r.replace('@tko/', '../') + '/dist/index.mjs')

console.log(deps.join(' '))
