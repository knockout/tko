
src 		:= $(shell find src -name *.js)
log-level 	?= warning

package := $(shell node -e "console.log(require('./package.json').name)")
version := $(shell node -e "console.log(require('./package.json').version)")
peer_src := $(shell node ../../tools/peer_dependencies.mjs)

banner := /*! ${package} 🥊 ${version} 🥊 (c) The Knockout.js Team 🥊 https://tko.io 🥊 License: MIT (https://opensource.org/licenses/MIT) */

default:: esm

esm: dist/index.mjs
commonjs: dist/index.js

*.ts:

info:
	@echo "Package: $(package)"
	@echo "Version: $(version)"
	@echo
	@echo "Source $(src)"
	@echo
	@echo "Peer Source": $(peer_src)

$(peer_src):
	@echo "Compiling peer dependency $@"
	cd $(dir $@) && make

# ./node_modules/.bin/esbuild
# Build a ES6 export module.
dist/index.mjs: $(src) $(peer_src)
	npx esbuild \
		--platform=neutral \
		--log-level=$(log-level) \
		--banner:js="$(banner)" \
		--bundle \
		--sourcemap=external \
		--outfile=dist/index.mjs \
		./src/index.js

# Build a CommonJS bundle, targetting ES6.
dist/index.js: $(src) $(peer_src)
	npx esbuild \
		--platform=neutral \
		--target=es6 \
		--format=cjs \
		--log-level=$(log-level) \
		--banner:js="$(banner)" \
		--bundle \
		--sourcemap=external \
		--outfile=dist/index.js \
		./src/index.js

# As browser-include
# --target=es6 \
# --format=iife \
# --minify \
# --outfile=index.es6.min?.js

clean:
	rm -rf dist/*
