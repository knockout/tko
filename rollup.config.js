
import fs from 'fs'
import nodeResolve from 'rollup-plugin-node-resolve'
import nodeDirect from 'rollup-plugin-node-direct'
import replace from 'rollup-plugin-replace'
import rollupBabel from 'rollup-plugin-babel'

const pkg = JSON.parse(fs.readFileSync("package.json"))

const CONFIG = {
  /* Replace {{VERSION}} with pkg.json's `version` */
  REPLACE: { delimiters: ['{{', '}}'], VERSION: `"${pkg.version}"` },
  RESOLVE: { jsnext: true, customResolveOptions: {moduleDirectory: "packages"} },
  DIRECT: { paths: ['packages'], verbose: process.argv.includes('--debug') },
  BABEL: { exclude: 'node_modules/**' }
}

const plugins = [
  replace(CONFIG.REPLACE),
  nodeResolve(CONFIG.RESOLVE),
  // nodeDirect(CONFIG.DIRECT)
]

if (process.env.USE_BABEL) {
  plugins.push(rollupBabel(CONFIG.BABEL))
}

export default {
  plugins,
  entry: 'index.js',
  format: 'umd',
  moduleName: pkg.name,
  sourceMap: true,
}
