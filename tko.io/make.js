#!/usr/bin/env node

const fs = require('fs-extra')
const yaml = require('js-yaml')
const pug = require('pug')
const debounce = require('lodash.debounce')
const hljs = require('highlight.js')
const matter = require('gray-matter')


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

const config = yaml.load(fs.readFileSync('./settings.yaml'))

function * genParts (sources) {
  for (const sourceMd of config.sources) {
    const source = fs.readFileSync(sourceMd, ENC)
    const {content, data} = matter(source)
    const html = md.render(content)
    yield {html, data}
  }
}

function make () {
  console.log("👲   Starting at ", new Date())
  /**
   * Make build/
   */
  fs.mkdirs('build/')

  /**
   * Make build/index.html
   */
  console.log('  Making build/index.html')
  const config = yaml.load(fs.readFileSync('./settings.yaml'))
  const parts = Array.from(genParts(config.sources))
  const locals = Object.assign(config, {parts})
  const html = pug.renderFile('src/index.pug', locals)
  fs.writeFileSync(config.dest, html)

  /**
   * Make build/tko.css
   */
  console.log('  Making build/tko.css')
  fs.copySync('src/tko.css', 'build/tko.css')

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

    Run "dev_appserver.py ." to start the Google Cloud development server.
  `)
  make()
}
