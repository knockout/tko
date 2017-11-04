#!/usr/bin/env node

const fs = require('fs-extra')
const yaml = require('js-yaml')

const mdfm = require('markdown-it-front-matter')
const md = require('markdown-it')({
	html: true,
	linkify: true,
	typographer: true
}).use(mdfm, frontMatter)

const ENC = {encoding: 'utf8'}


const config = yaml.load(fs.readFileSync('./settings.yaml'))

function frontMatter () {}

function * genParts(sources) {
	for (const sourceMd of config.sources) {
		const source = fs.readFileSync(sourceMd, ENC)
		const asHtml = md.render(source)
			
		yield asHtml
	}
}

const html = Array.from(genParts(config.sources))
	.join("\n<!-- ---- ---- ---- -->")

const df = fs.writeFileSync(config.dest, html)


console.log("HTML::::\n", html)