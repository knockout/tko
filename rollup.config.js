import * as fs from 'fs'
import * as path from 'path'
import nodeResolve from 'rollup-plugin-node-resolve'
import replace from 'rollup-plugin-replace'
import typescript from 'rollup-plugin-typescript'
import uglify from 'rollup-plugin-uglify'
import rollupVisualizer from 'rollup-plugin-visualizer'

const pkg = JSON.parse(fs.readFileSync('package.json'))
const { LERNA_PACKAGE_NAME, LERNA_ROOT_PATH } = process.env
const PACKAGE_ROOT_PATH = path.join(LERNA_ROOT_PATH, 'packages', LERNA_PACKAGE_NAME)
const IS_BROWSER_BUNDLE = LERNA_PACKAGE_NAME === 'tko'

const CONFIG = {
  INPUT: path.join(PACKAGE_ROOT_PATH, 'src/index.js'),
  OUTPUT: path.join(PACKAGE_ROOT_PATH, 'dist', `${LERNA_PACKAGE_NAME}.js`),
  VISUALIZER: { filename: 'visual.html' },

  /* Use TypeScript instead of babel for transpilation for IE6 compat, plus it's faster */
  TYPESCRIPT: {
    include: '**/*.js',
    exclude: 'node_modules',
    typescript: require('typescript')
  },

  /* tko modules only supported w/ modern JS bundlers (ES2015) */
  EXTERNAL: IS_BROWSER_BUNDLE ? undefined : getTkoModules(),
  FORMAT: IS_BROWSER_BUNDLE ? 'umd' : 'es',
  RESOLVE: { module: true },
  
  /* Replace {{VERSION}} with pkg.json's `version` */
  REPLACE: { delimiters: ['{{', '}}'], VERSION: pkg.version },
}

const PLUGINS = [
  typescript(CONFIG.TYPESCRIPT),
  replace(CONFIG.REPLACE),
  nodeResolve(CONFIG.RESOLVE),
  ...(IS_BROWSER_BUNDLE ? [rollupVisualizer(CONFIG.VISUALIZER)] : [])
]

export default [
  createRollupConfig({ minify: false }),
  ...(IS_BROWSER_BUNDLE ? [createRollupConfig({ minify: true })] : [])
]

function getTkoModules () {
  return fs.readdirSync(path.resolve(__dirname, 'packages'))
}

function createRollupConfig ({ minify }) {
  return {
    plugins: [
      ...PLUGINS,
      ...(minify ? [uglify()] : [])
    ],
    input: CONFIG.INPUT,
    external: CONFIG.EXTERNAL,
    output: {
      file: minify ? CONFIG.OUTPUT.replace('.js', '.min.js') : CONFIG.OUTPUT,
      format: CONFIG.FORMAT,
      name: LERNA_PACKAGE_NAME
    },
    sourcemap: true
  }
}