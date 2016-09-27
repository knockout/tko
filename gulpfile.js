 /* globals require */
 /* eslint semi:0, no-console: 0 */

const cp = require('child_process')

var gulp = require('gulp')
require('tko-policy')(gulp)

const S_INHERIT = { encoding: 'utf8', stdio: 'inherit' }


function repoUrl(project) {
    if (!project.includes('/')) {
        // Project is "plain"; being loaded from npm.
        return
    }
    if (!project.startsWith('https:') && !project.startsWith('git@')) {
        project = project.replace(/^github:/, "")
        if (!project.endsWith('.git')) { project += '.git' }
        return `https://github.com/` + project
    }
    return project
}


gulp.task("submodules", () => {
    let pkg = require('./package.json');
    for (let subpackage in pkg.dependencies) {
        var project = repoUrl(pkg.dependencies[subpackage]);
        if (!project) {
            console.log(`Skipping non-repo: ${subpackage}.`)
            continue
        }
        let args = ["submodule", "add", repoUrl(project)]
        console.log("  $ ", `git ${args.join(" ")}`)
        cp.spawnSync("git", args, S_INHERIT)
    }
})


gulp.task("submodules:update", () => {
    let args = [
        "submodules",
        "update",
        "--remote"
    ]
    cp.spawnSync("git", args)
})
