#!/usr/bin/env node

const fs = require('fs-extra')
const yaml = require('js-yaml')
const pug = require('pug')
const debounce = require('lodash.debounce')
const hljs = require('highlight.js')
const {spawn} = require('child_process')
const {argv} = process

function highlight (str, lang) {
  if (!lang) { return '' }
  if (hljs.getLanguage(lang)) {
    try {
      return hljs.highlight(lang, str).value
    } catch (__) {}
  }
  return ''
}

const md = require('markdown-it')({
  html: true,
  linkify: true,
  typographer: true,
  highlight
})

const ENC = {encoding: 'utf8'}

function * genHtmlIncludes ({includes}, htmlSettings, config) {
  for (const relPath of includes || []) {
    const sourcePath = '../packages/' + relPath
    console.log('  |  ', sourcePath)
    const source = fs.readFileSync(sourcePath, ENC)
    if (sourcePath.endsWith('.md')) {
      yield `<span data-bind='source: \"${relPath}\"'></span>
      ${md.render(source)}`
    } else if (sourcePath.endsWith('.pug')) {
      yield pug.render(source, Object.assign({}, htmlSettings, config))
    } else {
      throw new Error(`Bad extension: ${sourcePath} (not .md or .pug)`)
    }
  }
}

function * genSections (htmlConfig, config) {
  for (const section of htmlConfig.sections) {
    console.log(`  |- ${section.title}`)
    section.html = Array.from(genHtmlIncludes(section, htmlConfig, config)).join('\n')
    yield section
  }
}

function makeHtml({htmlSettings, scripts, links, styles}, config) {
  /**
   * Make build/index.html
   */
  console.log(`  Making ${htmlSettings.dest}`)
  Object.assign(htmlSettings, {scripts, links, styles}) // add links + scripts
  const sections = Array.from(genSections(htmlSettings, config))
  const locals = Object.assign(htmlSettings, {sections})
  const html = pug.renderFile('src/index.pug', locals)
  fs.writeFileSync(htmlSettings.dest, html)
}

function make () {
  console.log('👲   Starting at ', new Date())

  /**
   * Make build/
   */
  fs.mkdirs('build/')

  const styles = fs.readFileSync('src/tko.css')
  const config = yaml.load(fs.readFileSync('./settings.yaml', ENC))
  const {scripts, links} = config

  makeHtml({ htmlSettings: config.index, styles, scripts, links }, config)
  makeHtml({ htmlSettings: config['3to4'], styles, scripts, links }, config)

  console.log("🏁  Complete.", new Date())
  /**
   * Make Legacy Javascript
   */
  // console.log('Making build/tko-io.js')
  // fs.copySync('src/tko-io.js', 'build/tko-io.js')
}

if (argv.includes('-w')) {
  const ignored = '' // /(^|[\/\\])(\..|build\/*)/
  require('chokidar')
    .watch(['settings.yaml', 'src', '../packages'], {ignored})
    .on('all', debounce(make, 150))
} else {
  console.log(`
    Usage: make.js [-w] [-s]

      -w   Watch and rebuild on change
      -s   Start the server with 'dev_appserver.py .' (from Google Cloud)

    Deploy with:
	
	$  gcloud app deploy --project tko-io .
  `)
  make()
}

if (argv.includes('-s')) {
  spawn('dev_appserver.py', ['.'], {stdio: 'inherit'})
}
