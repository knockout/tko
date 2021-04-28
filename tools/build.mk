
src 		:= $(shell find src -name *.js) \
			   $(shell find src -name *.ts) \
			   index.ts
log-level 	?= warning

package := $(shell node -e "console.log(require('./package.json').name)")
version := $(shell node -e "console.log(require('./package.json').version)")
peer_src := $(shell node ../../tools/peer_dependencies.mjs)

banner := // ${package} 🥊 ${version}

default::
	$(MAKE) -j3 esm commonjs

esm: dist/index.mjs
commonjs: dist/index.js
browser: dist/browser.min.js

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
		--outfile=$@ \
		./index.ts

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
		--outfile=$@ \
		./index.ts

dist/browser.min.js:
	npx esbuild \
		--platform=neutral \
		--target=es6 \
		--format=iife \
		--global-name=tko \
		--log-level=$(log-level) \
		--banner:js="$(banner)" \
		--bundle \
		--minify \
		--sourcemap=external \
		--outfile=$@ \
		./index.ts

clean:
	rm -rf dist/*
