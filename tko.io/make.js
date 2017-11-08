#!/usr/bin/env node

const fs = require('fs-extra')
const yaml = require('js-yaml')
const pug = require('pug')
const debounce = require('lodash.debounce')
const hljs = require('highlight.js')

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

function * genHtmlIncludes ({includes}, config) {
  for (const sourcePath of includes || []) {
    console.log('  |  ', sourcePath)
    const source = fs.readFileSync(sourcePath, ENC)
    if (sourcePath.endsWith('.md')) {
      yield `<hr/><pre>${sourcePath}</pre>` + md.render(source)
    } else if (sourcePath.endsWith('.pug')) {
      yield pug.render(source, config)
    } else {
      throw new Error(`Bad extension: ${sourcePath} (not .md or .pug)`)
    }
  }
}

function * genSections (config) {
  for (const section of config.sections) {
    console.log(`  |- ${section.title}`)
    section.html = Array.from(genHtmlIncludes(section, config)).join('\n')
    yield section
  }
}

function make () {
  console.log('👲   Starting at ', new Date())
  /**
   * Make build/
   */
  fs.mkdirs('build/')

  const styles = fs.readFileSync('src/tko.css')

  /**
   * Make build/index.html
   */
  console.log('  Making build/index.html')
  const config = yaml.load(fs.readFileSync('./settings.yaml', ENC))
  const sections = Array.from(genSections(config))
  const locals = Object.assign(config, {sections, styles})
  const html = pug.renderFile('src/index.pug', locals)
  fs.writeFileSync(config.dest, html)

  /**
   * Make Legacy Javascript
   */
  // console.log('Making build/tko-io.js')
  // fs.copySync('src/tko-io.js', 'build/tko-io.js')
}

if (process.argv.includes('-w')) {
  const ignored = '' // /(^|[\/\\])(\..|build\/*)/
  require('chokidar')
    .watch(['settings.yaml', 'src', '../packages'], {ignored})
    .on('all', debounce(make, 150))
} else {
  console.log(`
    make.js [-w]

      -w   Watch and rebuild on change

    Run 'dev_appserver.py .' to start the Google Cloud development server.
  `)
  make()
}
