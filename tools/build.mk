
tools_dir	:= ../../tools
log-level 	?= warning

src 		:= $(shell find src -name '*.ts')
esm-dist	:= $(subst src/,dist/,$(src:.ts=.js))

package := $(shell node -e "console.log(require('./package.json').name)")
version := $(shell node -e "console.log(require('./package.json').version)")

banner := // ${package} 🥊 ${version}
iife-global-name := tko

KARMA 	:= npx karma
ESBUILD := npx esbuild
.SUFFIXES:
.SUFFIXES: .ts .js

default::
	$(MAKE) esm commonjs mjs

browser: dist/browser.min.js dist/browser.js
commonjs: dist/index.cjs
esm: dist/index.js
mjs: dist/index.mjs

*.ts:

package.json:

info:
	@echo "Package: $(package)"
	@echo "Version: $(version)"
	@echo
	@echo "Source $(src)"

# Build a ES6 export module.
dist/index.js: $(src) package.json
	@echo "[make] Compiling ${package} => $@"
	$(ESBUILD) \
		--platform=neutral \
		--log-level=$(log-level) \
		--banner:js="$(banner) ESM" \
		--define:BUILD_VERSION='"${version}"' \
		--sourcemap=external \
		--outdir=dist/ \
		$(src)

dist/index.mjs: $(src) package.json
	@echo "[make] Compiling ${package} => $@"
	$(ESBUILD) \
		--platform=neutral \
		--log-level=$(log-level) \
		--banner:js="$(banner) MJS" \
		--define:BUILD_VERSION='"${version}"' \
		--sourcemap=external \
		--outfile=dist/index.mjs \
		src/index.ts

# Build a CommonJS bundle, targetting ES6.
dist/index.cjs: $(src) package.json
	@echo "[make] Compiling ${package} => $@"
	$(ESBUILD) \
		--platform=neutral \
		--target=es6 \
		--format=cjs \
		--log-level=$(log-level) \
		--banner:js="$(banner) CommonJS" \
		--define:BUILD_VERSION='"${version}"' \
		--bundle \
		--sourcemap=external \
		--outfile=$@ \
		./index.ts

dist/browser.min.js: $(src) package.json
	@echo "[make] Compiling minified ${package} => $@"
	$(ESBUILD) \
		--platform=browser \
		--target=es6 \
		--format=iife \
		--global-name=$(iife-global-name) \
		--log-level=$(log-level) \
		--banner:js="$(banner) IIFE" \
		--footer:js="(typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : global).$(iife-global-name) = $(iife-global-name).default" \
		--define:BUILD_VERSION='"${version}"' \
		--bundle \
		--minify \
		--sourcemap=external \
		--outfile=$@ \
		./src/index.ts

dist/browser.js: $(src) package.json
	@echo "[make] Compiling ${package} => $@"
	$(ESBUILD) \
		--platform=browser \
		--target=es6 \
		--format=iife \
		--global-name=$(iife-global-name) \
		--log-level=$(log-level) \
		--banner:js="$(banner) IIFE" \
		--footer:js="(typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : global).$(iife-global-name) = $(iife-global-name).default" \
		--define:BUILD_VERSION='"${version}"' \
		--bundle \
		--sourcemap=external \
		--outfile=$@ \
		./src/index.js

repackage: $(tools_dir)/repackage.mjs ../../lerna.json
	node $(tools_dir)/repackage.mjs

clean:
	rm -rf dist/*

test: esm
	$(KARMA) start $(tools_dir)/karma.conf --once

watch: esm
	$(KARMA) start $(tools_dir)/karma.conf

test-ci:
	$(KARMA) start $(tools_dir)/karma.conf --once --sauce
