
const _ = require('lodash')
const fs = require('fs')
const resolve = require('resolve')
const {execSync, exec} = require('child_process')

const UTF = { encoding: 'utf-8' }
const WORK_DIR = 'work/'
const GIT_OPTS = { cwd: WORK_DIR }
const gulp = global.__tko_gulp
const work = global.config.work || {
  packages: /tko\..*/
}
var PATHS

function throwIfErr(err) {
  if (err) { throw err }
}

function repoPkg(repo) {
  // return JSON.parse(fs.readFileSync(`node_modules/${repo}/package.json`, UTF))
  var pkg = null
  resolve.sync(repo, {
    basedir: process.cwd(),
    packageFilter: (p, f) => pkg = p
  })
  return pkg
}

/**
 * There are several forms that the URL will come in.  Some may require
 * usernames + passwords (git:), others will straight-up not work (git+https:)
 *
 * Sample URL:
 * 
 *  git+https://github.com/knockout/tko.binding.core.git
 */
function canonRepoUrl(url) {
  return url.replace('git+', '')
    .replace('git:', 'https:')
}


function alreadyCloned(pkgName) {
  return fs.existsSync(WORK_DIR + pkgName)
}


function gitAction(icon, action, pkgName, opts) {
  const repoUrl = canonRepoUrl(repoPkg(pkgName).repository.url)
  const cmd = `git ${action} ${repoUrl}`
  console.log(`${icon}  ${action}    ${pkgName.blue} at ${repoUrl}`)
  return execSync(cmd, opts)
}


gulp.task('work:mkdir', () => {
  try {
    fs.mkdirSync(WORK_DIR)
  } catch(err) { if (err.code !== "EEXIST") { throw e } }
})


gulp.task('work:clone', ['work:mkdir'], () => {
  return _(global.pkg.dependencies)
    .pickBy((remote, pkgName) =>
      work.packages.test(pkgName) && !alreadyCloned(pkgName)
    )
    .each((remote, pkgName) =>
      gitAction('🌻', 'clone', pkgName, GIT_OPTS)
    )
})


gulp.task('work:pull', ['work:mkdir'], () => {
  return fs.readdirSync(WORK_DIR)
    .forEach((pkgName) =>
      gitAction('⬆️', 'pull', pkgName,
        Object.assign({cwd: WORK_DIR + pkgName})
      )
    )
})


const DIFF_CMD = 'git diff HEAD'
const AHEAD_BEHIND_CMD = 'git rev-list --left-right --count master...origin/master'

gulp.task('work:status', () => {
  PATHS = fs.readdirSync(WORK_DIR)
  const longest = _.maxBy(PATHS, (p) => p.length).length
  
  return PATHS.forEach((path) => {
      const OPTS = Object.assign({}, UTF, { cwd: WORK_DIR + path })
      const modified = Boolean(execSync(DIFF_CMD, OPTS))
      const [ahead, behind] = execSync(AHEAD_BEHIND_CMD, OPTS).split(/\s+/)
      const outdated = ahead !== behind || ahead !== '0'
      
      const mColor = modified ? 'red' : outdated ? 'yellow' : 'green'
      const mText = modified ? 'modified'.red : ''
      const aText = _.parseInt(ahead) ? `${ahead.blue} ahead of remote` : ''
      const bText = _.parseInt(behind) ? `${behind.blue} behind remote` : ''
      const pathStr = _.padStart(path, longest)
      const texts = [aText, bText, mText].filter((v) => v).join(', ') || 'ok'
      
      console.log(`${pathStr[mColor]} ${texts}`)
    })
})


function execPromise(cmd, opts) {
  return new Promise((res, rej) => {
    exec(cmd, opts, (err, ...stdoe) => {
      if (err) { return rej(err) }
      res(stdoe) // [stdout, stderr]
    })
  })
}


function linkTo(pkg) {
  return Promise.all(
    PATHS
      .concat('..')
      .map((path) => {
        console.log(`     🖇  ${path.magenta}$ yarn link ${pkg}  `)
        return execPromise(`yarn link ${pkg}`, {cwd: WORK_DIR + path})
      })
  )
}


function createLink(path) {
  console.log(` 🔗  ${path.red}$ yarn link`)
  execSync('yarn link', {cwd: WORK_DIR + path})
  return linkTo(path)
}


gulp.task('work:link', 'Run `yarn link` in/against each work directory', () => {
  PATHS = fs.readdirSync(WORK_DIR)
  const paths = [...PATHS]
  function link() {
    const p = paths.pop()
    if (!p) { return }
    return createLink(p).then(link)
  }

  link().catch(console.error)
})



// gulp.task('work:prune', ['work:mkdir'], () => {
//   Remove any directories not in package.json.
// })


gulp.task('work:update', ['work:pull', 'work:clone'], _.noop)