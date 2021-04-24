
src 		:= $(wildcard src/*.ts)
log-level 	?= warning

package := $(shell node -e "console.log(require('./package.json').name)")
version := $(shell node -e "console.log(require('./package.json').version)")
peer_dependencies := $(shell node ../../tools/peer_dependencies.mjs)

banner := /*! ${package} 🥊 ${version} 🥊 (c) The Knockout.js Team 🥊 https://tko.io 🥊 License: MIT (https://opensource.org/licenses/MIT) */

default:: dist/index.mjs

*.ts:

info:
	@echo "package: $(package)"
	@echo "version: $(version)"
	@echo "dependencies: $(peer_dependencies)"

$(peer_dependencies):
	cd $(dir $(peer_dependencies)); make dist/index.mjs

# ./node_modules/.bin/esbuild
# Build a ES6 export module.
dist/index.mjs: $(src) $(peer_dependencies)
	@echo "Dependencies: $(peer_dependencies)"
	npx esbuild \
		--platform=neutral \
		--log-level=$(log-level) \
		--banner:js="$(banner)" \
		--bundle \
		--sourcemap=external \
		--outfile=dist/index.mjs \
		./src/index.js


# As browser-include
# --target=es6 \
# --format=iife \
# --minify \
# --outfile=dist/index.es6.min?.js

clean:
	rm -rf dist/*
