 /* globals require */
 /* eslint semi:0, no-console: 0 */

const cp = require('child_process')

var gulp = require('gulp')
require('tko-policy')(gulp)
const replace = require('gulp-replace')

gulp.task("make:ko", ['make'], function () {
  gulp.src("dist/tko.js")
    .pipe(replace(/global.tko = factory/, "global.ko = factory"))
    .pipe(gulp.dest("dist/ko.js"))
})


