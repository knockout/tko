
var fs = require('fs')

require('colors')
var yaml = require('js-yaml')
var _ = require('lodash')

const CONFIG_READ_THROTTLE = 125

Object.defineProperty(global, 'pkg', {
  get: _.throttle(
      () => require(`${process.cwd()}/package.json`),
      CONFIG_READ_THROTTLE)
})

Object.defineProperty(global, 'config', {
  get: _.throttle(
      () => yaml.load(fs.readFileSync("config.yaml", 'utf8')),
      CONFIG_READ_THROTTLE)
})

module.exports = function(gulp) {
  global.__tko_gulp = require('gulp-help')(gulp);
  var tasks_path = __dirname + "/tasks"

  fs.readdirSync(tasks_path)
    .filter((file) => file.endsWith('.js'))
    .forEach((file) => require(`${tasks_path}/${file}`))

  gulp.task('default', false, ['help'])
}
