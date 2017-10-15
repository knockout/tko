import * as fs from 'fs'
import * as path from 'path'
import nodeResolve from 'rollup-plugin-node-resolve'
import replace from 'rollup-plugin-replace'
import rollupVisualizer from 'rollup-plugin-visualizer'

console.log('HHHITTTTT')
process.exit()

const pkg = JSON.parse(fs.readFileSync('package.json'))
const { LERNA_PACKAGE_NAME, LERNA_ROOT_PATH } = process.env
const PACKAGE_ROOT_PATH = path.join(LERNA_ROOT_PATH, 'packages', LERNA_PACKAGE_NAME)
const IS_BROWSER_BUNDLE = LERNA_PACKAGE_NAME === 'tko'

const CONFIG = {
  EXTERNAL: IS_BROWSER_BUNDLE ? undefined : getTkoModules(),
  FORMAT: IS_BROWSER_BUNDLE ? 'umd' : 'es',
  INPUT: path.join(PACKAGE_ROOT_PATH, 'src/index.js'),
  /* Replace {{VERSION}} with pkg.json's `version` */
  REPLACE: { delimiters: ['{{', '}}'], VERSION: pkg.version },
  RESOLVE: { module: true },
  VISUALIZER: { filename: 'visual.html' }
}

const plugins = [
  replace(CONFIG.REPLACE),
  nodeResolve(CONFIG.RESOLVE),
  rollupVisualizer(CONFIG.VISUALIZER)
]

export default {
  plugins,
  input: CONFIG.INPUT,
  external: CONFIG.EXTERNAL,
  output: {
    file: path.join(PACKAGE_ROOT_PATH, 'dist', `${LERNA_PACKAGE_NAME}.js`),
    format: CONFIG.FORMAT,
    name: LERNA_PACKAGE_NAME
  },
  sourcemap: true
}

function getTkoModules () {
  return fs.readdirSync(path.resolve(__dirname, 'packages'))
}
