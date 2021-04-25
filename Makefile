NPX		:= npx
NODE  	:= node
NPM		:= npm

# Some make settings
SHELL := bash
.ONESHELL:
MAKEFLAGS += --warn-undefined-variables
MAKEFLAGS += --no-builtin-rules

packages 	:= $(wildcard packages/*)

default:
	@echo " 📦  ${packages}"

all::
	make -j6 $(packages)

.PHONY: $(packages)
$(packages): # dependencies: src/* packages.json{@tko/*}
	@echo "hey $@ $< $? $@"
	cd $@; make

.PHONY: test
test:
	npm run test --workspaces

.PHONY: testn
testn:
	lerna exec --concurrency=6 --loglevel=warn -- npm run test

.PHONY: lint
lint:
	$(NPX) standard

.PHONY: repackage
repackage:
	$(NPX) ./tools/common-package-config.js packages/shared.package.json packages/*/package.json

.PHONY: bump
bump:
	lerna version

# from-git "identify packages tagged by lerna version and publish them to npm."
# from-package "packages where the latest version is not present in the registry"
publish-unpublished: build
	lerna publish from-package

package.json:

install: node_modules

node_modules: package.json packages/*/package.json
	npm i

outdated-list:
	$(NPX) npm-check-updates
	npm outdated

outdated-upgrade:
	npm upgrade-interactive --latest

install: node_modules
