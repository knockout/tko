NPX		:= npx
NODE  	:= node
NPM		:= npm

# Some make settings
SHELL := bash
.ONESHELL:
MAKEFLAGS += --warn-undefined-variables
MAKEFLAGS += --no-builtin-rules

packages 	:= $(wildcard packages/*)
package_jsons := $(wildcard packages/*/package.json)

default: all

all::
	make -j8 $(packages)
	make -j8 $(package_jsons)

.PHONY: $(packages)
$(packages):
	cd $@; make

test:
	npm run test --workspaces

lint:
	$(NPX) standard

repackage: $(package_jsons)

$(package_jsons): tools/repackage.mjs
	PKG=`dirname $@`
	cd $(shell dirname $@); make repackage

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
	npm outdated

outdated-upgrade:
	npm upgrade-interactive --latest

install: node_modules

clean:
	rm -rf packages/*/dist/*
