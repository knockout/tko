//
// Make
// ---
// Produce a UMD version of the source in dist/
//
// Note we can resolve "external" includes with e.g.
// resolveExternal: function ( id ) {
//         return path.resolve( __dirname, id );
//     }
// per https://github.com/rollup/rollup/issues/104
//


const gulp = global.__tko_gulp

const rollup = require('rollup')
const nodeResolve = require('rollup-plugin-node-resolve')
const nodeDirect = require('rollup-plugin-node-direct')
const babel = require('rollup-plugin-babel')
const replace = require('rollup-plugin-replace')
const _ = require('lodash')

const pkg_name = _.get(config, 'package.name', global.pkg.name)


const babelOptions = {
  exclude: 'node_modules/**',
  presets: [
    [require.resolve('babel-preset-es2015'), { modules: false }],
    require.resolve('babel-preset-stage-0'),
  ],
  plugins: [
    require.resolve('babel-plugin-external-helpers'),
    [require.resolve('babel-plugin-transform-es2015-classes'), { loose: true }],
    require.resolve('babel-plugin-transform-proto-to-assign')
  ],
  babelrc: false
}

const REPLACE_CONFIG = {
  delimiters: ['{{', '}}'],
  VERSION: `"${global.pkg.version}"`
}


const DIRECT_CONFIG = {
  paths: [ 'work', '..' ],
  verbose: process.argv.includes('--debug')
}

const RESOLVE_CONFIG = {
  jsnext: true
}


function compile(name, suffix, plugins=[]) {
  const dest = `dist/${name}.${suffix}`
  return rollup.rollup({
      entry: 'index.js',
      plugins: [
        replace(REPLACE_CONFIG),
        nodeDirect(DIRECT_CONFIG),
        nodeResolve(RESOLVE_CONFIG),
        ...plugins
      ]
    })
    .then((bundle) => 
      bundle.write({ format: 'umd', moduleName: name, dest: dest })
    )
}


gulp.task("make:js", () => {
  return compile(pkg_name, "js", [babel(babelOptions)])
})


gulp.task("make:es6", () => {
  return compile(pkg_name, "es6", [])
})

gulp.task('make', ['make:js', 'make:es6'])