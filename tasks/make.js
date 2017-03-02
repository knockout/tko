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
const nodeResolve = require('rollup-plugin-node-resolve');
const nodeDirect = require('rollup-plugin-node-direct')


gulp.task('make', 'Run rollup to make UMD files in dist/', function () {
  var dest = `dist/${global.pkg.name}.js`
  console.log(`🔨  Compiling index.js -> ${dest.green}`)
  return rollup.rollup({
      entry: 'index.js',
      plugins: [
        nodeDirect({
          paths: [ 'work', '..' ],
          verbose: process.argv.includes('--debug')
        }),
        nodeResolve({ jsnext: true })
      ],
    }).then(function(bundle) {
      return bundle.write({
        format: 'umd',
        moduleName: global.pkg.name,
        dest: dest,
      })
    })
})
