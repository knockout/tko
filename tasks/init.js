//
// -- init -- task
//
var fs = require('fs')
var path = require('path')
var child_process = require('child_process')

var _ = require('lodash')
var gulp = global.__tko_gulp

var template_dir = path.join(__dirname, '../templates')

// The following are files created/updated in the package directory, from
// the /templates directory
var FILES = {
  LICENSE: 'LICENSE',
  // 'config.yaml': 'config.yaml',
  'circle.yml': 'circle.yml',
  'config.yaml': 'config.yaml',
  eslintrc: '.eslintrc',
  editorconfig: '.editorconfig',
  gitignore: '.gitignore',
  'karma.conf.js': 'karma.conf.js',
  npmignore: '.npmignore',
  'README.md': 'README.md',
}

// Template variables
// License: {{ year }} / {{ pkg.author }}
// README.md: ...

gulp.task('init', 'Create the common tko package files', function () {
  // Gather bits of info first.
  if (_.get(global.pkg, 'tko.blacklist')) {
    throw new Error(`tko.tools cannot init ${global.pkg.name} because it is blacklisted in package.json.`)
  }

  var modified_files_cmd = `git ls-files -mo --exclude-standard ${_.values(FILES).join(" ")}`
  var modified_files = child_process.execSync(
    modified_files_cmd, {encoding: 'utf8'})

  if (modified_files !== '') {
    throw new Error(`There are modified files: ${modified_files}`)
  }

  _.each(FILES, write_template_file)
}, {
  description: `Files created: ${_.values(FILES).join(' ')}`
})

function exists(path) {
  // See eg http://stackoverflow.com/questions/4482686
  try {
    fs.accessSync(path, fs.F_OK);
    return true
  } catch (e) {
    return false
  }
}


function write_template_file(dst_filename, src_filename) {
  var dst_path = path.join(process.cwd(), dst_filename)
  var src_path = path.join(template_dir, src_filename)
  var template = fs.readFileSync(src_path, {encoding: 'utf8'})
  var compiled = _.template(template)({
    pkg: global.pkg, now: new Date()
  })

  if (exists(dst_path)) {
    console.log(`Overwriting ${dst_path.magenta}.`)
  } else {
    console.log(`Creating ${dst_path.green}.`)
  }
  fs.writeFileSync(dst_path, compiled)
}
