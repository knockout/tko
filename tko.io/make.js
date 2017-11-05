#!/usr/bin/env node

const fs = require('fs-extra')
const yaml = require('js-yaml')
const pug = require('pug')
const debounce = require('lodash.debounce')
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
		const html = md.render(content)
		yield {html, data}
	}
}

function make() {

	/**
	 * Make build/
	 */
	fs.mkdirs('build/')

	/**
	 * Make build/index.html
	 */
	console.log("Making build/index.html")
	const parts = Array.from(genParts(config.sources))
	const html = pug.renderFile('src/index.pug', {parts})
	const df = fs.writeFileSync(config.dest, html)

	/**
	 * Make build/tko.css
	 */
	console.log("Making build/tko.css")
	fs.copySync('src/tko.css', 'build/tko.css')


	/**
	 * Make the Javascript
	 */
	console.log("Making build/tko-io.js")
	fs.copySync('src/tko-io.js', 'build/tko-io.js')
}

if (process.argv.includes('-w')) {
	const ignored = "" ///(^|[\/\\])(\..|build\/*)/
	require('chokidar')
		.watch('src', {ignored})
		.on('all', debounce(make, 50))
} else {
	make()
}
