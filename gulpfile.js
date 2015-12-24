/* eslint semi: 0*/
/* globals require */
/*

  Gulpfile
  --------

 */
var gulp = require('gulp'),
  yaml = require('js-yaml'),
  fs = require('fs'),
  config = yaml.safeLoad(fs.readFileSync('./config.yaml', 'utf8')),
  plugins = require('gulp-load-plugins')();

// from https://github.com/ikari-pl/gulp-tag-version
// function inc(importance) {
//   console.log(" ----  >>>  Don't forget: $ git push --tag");
//   return gulp.src(['./package.json' ])
//     .pipe(plugins.bump({type: importance}))
//     .pipe(gulp.dest('./'))
//     .pipe(plugins.git.commit('bumps package version'))
//     .pipe(plugins.filter('package.json'))
//     // .pipe(plugins.tagVersion());
//     // FIXME
//     // See https://github.com/ikari-pl/gulp-tag-version/issues/4
// }
//
// gulp.task('patch', function() { return inc('patch'); })
// gulp.task('feature', function() { return inc('minor'); })
// gulp.task('release', function() { return inc('major'); })

gulp.task('js', function () {
  gulp.src("./index.js")
    .pipe(plugins.header(config.header,
        {pkg: require('./package.json'), now: new Date()}))
    .pipe(plugins.footer(config.footer))
    .pipe(plugins.rename("knockout-fast-foreach.js"))
    .pipe(gulp.dest('./dist'))
    .pipe(plugins.uglify(config.uglify))
    .pipe(plugins.rename("knockout-fast-foreach.min.js"))
    .pipe(gulp.dest('./dist'));
});

gulp.task('watch', function () {
  gulp.watch('./index.js', ['js'])
})

gulp.task('default', ['js'])
