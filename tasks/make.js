//
// Make
// ---
// Produce a UMD version of the source in dist/
//

var gulp = global.__tko_gulp
var rollup = require('rollup')

gulp.task('make', 'Run rollup to make UMD files in dist/', function () {
  var dest = `dist/${global.pkg.name}.js`
  console.log(`🔨  Compiling index.js -> ${dest.green}`)
  rollup.rollup({
    entry: 'index.js',
  }).then(function(bundle) {
    return bundle.write({
      format: 'umd',
      moduleName: global.pkg.name,
      dest: dest,
    })
  })
})
