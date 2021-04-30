
src 		:= $(shell find src -name *.js) \
			   $(shell find src -name *.ts)
log-level 	?= warning

package := $(shell node -e "console.log(require('./package.json').name)")
version := $(shell node -e "console.log(require('./package.json').version)")
peer_src := $(shell node ../../tools/peer_dependencies.mjs)

banner := // ${package} 🥊 ${version}

default::
	$(MAKE) esm commonjs

esm: dist/index.js
commonjs: dist/index.cjs
browser: dist/browser.min.js

*.ts:

package.json:

info:
	@echo "Package: $(package)"
	@echo "Version: $(version)"
	@echo
	@echo "Source $(src)"
	@echo
	@echo "Peer Source": $(peer_src)

$(peer_src):
	@echo "Compiling peer dependency $@"
	cd $(dir $@)/.. && make

# ./node_modules/.bin/esbuild
# Build a ES6 export module.
dist/index.js: $(src) $(peer_src) package.json
	@echo "  ⚒  Compiling ${package} => $@"
	npx esbuild \
		--platform=neutral \
		--log-level=$(log-level) \
		--banner:js="$(banner) ESM" \
		--sourcemap=external \
		--outdir=dist/ \
		$(src)

# Build a CommonJS bundle, targetting ES6.
dist/index.cjs: $(src) $(peer_src) package.json
	@echo "  ⚒  Compiling ${package} => $@"
	npx esbuild \
		--platform=neutral \
		--target=es6 \
		--format=cjs \
		--log-level=$(log-level) \
		--banner:js="$(banner) CommonJS" \
		--bundle \
		--sourcemap=external \
		--outfile=$@ \
		./index.ts

dist/browser.min.js: $(src) $(peer_src) package.json
	@echo "  ⚒  Compiling ${package} => $@"
	npx esbuild \
		--platform=browser \
		--target=es6 \
		--format=iife \
		--global-name=tko \
		--log-level=$(log-level) \
		--banner:js="$(banner) IIFE" \
		--bundle \
		--minify \
		--sourcemap=external \
		--outfile=$@ \
		./index.ts

repackage: ../../tools/repackage.mjs ../../lerna.json
	node ../../tools/repackage.mjs

clean:
	rm -rf dist/*

test:
	npx karma start ../../karma.conf --once
