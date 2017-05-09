
import fs from 'fs'
import nodeResolve from 'rollup-plugin-node-resolve'
import replace from 'rollup-plugin-replace'
import rollupBabili from 'rollup-plugin-babili'
import rollupVisualizer from 'rollup-plugin-visualizer'
import includePaths from 'rollup-plugin-includepaths'


const pkg = JSON.parse(fs.readFileSync("package.json"))

const CONFIG = {
  /* Replace {{VERSION}} with pkg.json's `version` */
  BABILI: {sourceMap: true},
  INCLUDE_PATHS: { paths: [ "packages" ] },
  REPLACE: {delimiters: ['{{', '}}'], VERSION: pkg.version},
  RESOLVE: {jsnext: true, customResolveOptions: {moduleDirectory: "packages"}},
  VISUALIZER: { filename: "visual.html" },
}

const plugins = [
  includePaths(CONFIG.INCLUDE_PATHS),
  replace(CONFIG.REPLACE),
  nodeResolve(CONFIG.RESOLVE),
  rollupVisualizer(CONFIG.VISUALIZER),
]

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
