#!/usr/bin/env node

const fs = require('fs-extra')
const yaml = require('js-yaml')
const pug = require('pug')
var matter = require('gray-matter');


const md = require('markdown-it')({
	html: true,
	linkify: true,
	typographer: true
})

const ENC = {encoding: 'utf8'}


const config = yaml.load(fs.readFileSync('./settings.yaml'))

function frontMatter () {}

function * genParts(sources) {
	for (const sourceMd of config.sources) {
		const source = fs.readFileSync(sourceMd, ENC)
		const {content, data} = matter(source)
		const asHtml = md.render(content)
		yield asHtml
	}
}

/**
 * Make build/
 */
fs.mkdirs('build/')

/**
 * Make build/index.html
 */
console.log("Making build/index.html")
const body = Array.from(genParts(config.sources))
	.join("\n<!-- ---- ---- ---- -->")

const html = pug.renderFile('src/index.pug', {body})
const df = fs.writeFileSync(config.dest, html)

/**
 * Make build/tko.css
 */
console.log("Making build/tko.css")
fs.copySync('static/tko.css', 'build/tko.css')