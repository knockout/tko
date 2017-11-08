import * as fs from 'fs'
import * as path from 'path'
import alias from 'rollup-plugin-alias'
import babelMinify from 'rollup-plugin-babel-minify'
import nodeResolve from 'rollup-plugin-node-resolve'
import replace from 'rollup-plugin-replace'
import typescript from 'rollup-plugin-typescript'
// import uglify from 'rollup-plugin-uglify'
import rollupVisualizer from 'rollup-plugin-visualizer'
import * as tsconfig from './tsconfig.json'
import * as pkg from './package.json'

const { LERNA_PACKAGE_NAME, LERNA_ROOT_PATH } = process.env
const PACKAGE_ROOT_PATH = path.join(LERNA_ROOT_PATH, 'packages', LERNA_PACKAGE_NAME)
const IS_BROWSER_BUNDLE = LERNA_PACKAGE_NAME === 'tko'
const INPUT_FILE = path.join(PACKAGE_ROOT_PATH, 'src/index.js')
const TKO_MODULES = getTkoModules()
const PLUGIN_CONFIGS = {
  /* Use TypeScript instead of babel for transpilation for IE6 compat, plus it's faster */
  TYPESCRIPT: {
    include: '**/*.js',
    exclude: 'node_modules',
    typescript: require('typescript')
  },

  /* tko modules only supported w/ modern JS bundlers (ES2015) */
  RESOLVE: { module: true },

  /* Replace {{VERSION}} with pkg.json's `version` */
  REPLACE: { delimiters: ['{{', '}}'], VERSION: pkg.version },

  VISUALIZER: { filename: 'visual.html' }
}

/* Plugins used for all builds */
const UNIVERSAL_PLUGINS = [
  replace(PLUGIN_CONFIGS.REPLACE),
  nodeResolve(PLUGIN_CONFIGS.RESOLVE),
  rollupVisualizer(PLUGIN_CONFIGS.VISUALIZER)
]

export default [
  /* tko.<module?>.es6.js */
  createRollupConfig(),
  /* tko.<module?>.js */
  createRollupConfig({ transpile: true }),
  ...(IS_BROWSER_BUNDLE
    ? [
      /* tko.es6.min.js */
      createRollupConfig({ minify: true }),
      /* tko.min.js */
      createRollupConfig({ minify: true, transpile: true })
    ]
    : []
  )
]

function getTkoModules () {
  return fs.readdirSync(path.resolve(__dirname, 'packages'))
}

function getTkoES6Aliases () {
  return TKO_MODULES.reduce((accum, tkoModule) => Object.assign(accum, {
    [tkoModule]: path.resolve(
      LERNA_ROOT_PATH,
      `packages/${tkoModule}/dist/${tkoModule}.es6.js`
    )
  }))
}

function createRollupConfig ({ minify, transpile } = {}) {
  let filename = path.join(PACKAGE_ROOT_PATH, 'dist', LERNA_PACKAGE_NAME)

  const plugins = [
    ...UNIVERSAL_PLUGINS // clone
  ]

  if (transpile) {
    plugins.push(typescript(PLUGIN_CONFIGS.TYPESCRIPT))
  } else {
    /* must come before resolve plugin */
    plugins.unshift(alias(getTkoES6Aliases()))
    filename += '.es6'
  }

  if (minify) {
    // plugins.push(transpile ? uglify() : babelMinify({ comments: false }))
    plugins.push(babelMinify({ comments: false }))
    filename += '.min'
  }

  filename += '.js'

  return {
    plugins,
    input: INPUT_FILE,
    external: IS_BROWSER_BUNDLE ? undefined : TKO_MODULES,
    output: {
      file: filename,
      format: IS_BROWSER_BUNDLE ? 'umd' : 'es',
      name: LERNA_PACKAGE_NAME
    },
    sourcemap: true
  }
}
