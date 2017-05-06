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
const _ = require('lodash')

const rollup = require('rollup')
const nodeResolve = require('rollup-plugin-node-resolve')
const nodeDirect = require('rollup-plugin-node-direct')
const replace = require('rollup-plugin-replace')

const babel = require('./rollup-babel')

const pkg_name = _.get(config, 'package.name', global.pkg.name)



/**
 * Replace {{VERSION}} with package.json's `version`
 */
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
  return compile(pkg_name, "js", [babel.plugin(babel.options)])
})


gulp.task("make:es6", () => {
  return compile(pkg_name, "es6", [])
})

gulp.task('make', ['make:js', 'make:es6'])