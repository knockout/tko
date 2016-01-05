
require('colors')
var fs = require('fs')

global.pkg = require(`${process.cwd()}/package.json`)

module.exports = function(gulp) {
  global.__tko_gulp = require('gulp-help')(gulp);
  var tasks_path = __dirname + "/tasks"

  fs.readdirSync(tasks_path)
    .forEach((file) => require(`${tasks_path}/${file}`))

  gulp.task('default', false, ['help'])
}
