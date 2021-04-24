NPX		:= npx
NODE  	:= node
NPM		:= npm

# Some make settings
SHELL := bash
.ONESHELL:
MAKEFLAGS += --warn-undefined-variables
MAKEFLAGS += --no-builtin-rules

    # "prepublish": "yarn build",
    # "test": "lerna exec --concurrency=1 --loglevel=warn -- yarn test",
    # "build": "lerna exec --concurrency=6 --loglevel=warn -- yarn build"

# packages 	:= $(patsubst packages/%,%,$(wildcard packages/*))
packages := bind
targets_es6	:= $(foreach p,$(packages),packages/$(p)/dist/$(p).es6.js)
targets_es6	:= $(foreach p,$(packages),packages/$(p)/dist/$(p).esm.js)

# List peer dependencies of a given package.
# > (c => Object.keys(JSON.parse(fs.readFileSync("packages/"+c+"/package.json", "utf8")).dependencies).filter(c => c.startsWith("@tko/")))("bind")

$(targets_es6): # dependencies: src/* packages.json{@tko/*}

ES_TARGET := ES6

ESBUILD := ./node_modules/.bin/esbuild --platform=node \
				--target=ES_TARGET \
				--banner=js="//BANNER" \
				--footer=js="//FOOTER" \
				--bundle

default:
	@echo "PACKAGES ${packages}"
	@echo "es6 ${targets_es6}"
	@echo "esm ${targets_esm}"

.PHONY: test
test:
	npm run test --workspaces
# $(LERNA) exec --concurrency=1 --loglevel=warn -- npm run test

.PHONY: testn
testn:
	lerna exec --concurrency=6 --loglevel=warn -- npm run test

.PHONY: build
build: node_modules
# $(LERNA) exec --concurrency=6 --loglevel=warn -- npm run build
	npx lerna exec --loglevel=warn -- make -f ../../tools/build.mk dist/out.js log-level=info

.PHONY: lint
lint:
	$(NPX) standard

.PHONY: repackage
repackage:
	$(NPX) ./tools/common-package-config.js packages/shared.package.json packages/*/package.json

.PHONY: bootstrap
bootstrap:
	npm bootstrap

.PHONY: bump
bump:
	lerna version

# from-git "identify packages tagged by lerna version and publish them to npm."
# from-package "packages where the latest version is not present in the registry"
publish-unpublished: build
	lerna publish from-package

package.json:

node_modules: bootstrap package.json packages/*/package.json
	npm i

all: build test

outdated-list:
	$(NPX) npm-check-updates
	npm outdated

outdated-upgrade:
	npm upgrade-interactive --latest

install: node_modules
