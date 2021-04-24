
src 		:= $(wildcard src/*.ts)
log-level 	?= warning
es_target 	?= es2020

# e.g.
package := $(shell node -e "console.log(require('./package.json').name)")
version := $(shell node -e "console.log(require('./package.json').version)")

banner := /*! ${package} 🥊 ${version} 🥊 (c) The Knockout.js Team 🥊 https://tko.io 🥊 License: MIT (https://opensource.org/licenses/MIT) */

*.ts:

# ./node_modules/.bin/esbuild

dist/index.js: $(src)
	npx esbuild \
		--platform=neutral \
		--target=$(es_target) \
		--log-level=$(log-level) \
		--banner:js="$(banner)" \
		--bundle \
		--minify \
		--sourcemap=external \
		--format=iife \
		--outfile=dist/index.$(es_target).js \
		./src/index.js
