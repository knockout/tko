
import fs from 'fs'
import nodeResolve from 'rollup-plugin-node-resolve'
import replace from 'rollup-plugin-replace'
import rollupBabel from 'rollup-plugin-babel'
import rollupBabili from 'rollup-plugin-babili'
import rollupVisualizer from 'rollup-plugin-visualizer'
import includePaths from 'rollup-plugin-includepaths'


const pkg = JSON.parse(fs.readFileSync("package.json"))

const CONFIG = {
  /* Replace {{VERSION}} with pkg.json's `version` */
  BABEL: {exclude: 'node_modules/**'},
  BABILI: {sourceMap: true},
  INCLUDE_PATHS: { paths: [ "packages" ] },
  REPLACE: {delimiters: ['{{', '}}'], VERSION: `"${pkg.version}"`},
  RESOLVE: {jsnext: true, customResolveOptions: {moduleDirectory: "packages"}},
  VISUALIZER: { filename: "visual.html" },
}

const plugins = [
  includePaths(CONFIG.INCLUDE_PATHS),
  replace(CONFIG.REPLACE),
  nodeResolve(CONFIG.RESOLVE),
  rollupVisualizer(CONFIG.VISUALIZER),
]

if (process.env.USE_BABEL) {
  plugins.push(rollupBabel(CONFIG.BABEL))
}

if (process.env.MINIFY) {
  plugins.push(rollupBabili(CONFIG.BABILI))
}

export default {
  plugins,
  entry: 'index.js',
  format: 'umd',
  moduleName: pkg.name,
  sourceMap: true,
}
