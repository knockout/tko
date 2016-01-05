//
// Gulp tasks
//
var gulp = require('gulp')
var rollup = require('rollup')

gulp.task('make', function () {
  rollup.rollup({
    entry: 'index.js',
  }).then(function(bundle) {
    return bundle.write({
      format: 'umd',
      moduleName: 'tko.utils',
      dest: 'dist/tko.utils.js'
    });
  })
})
