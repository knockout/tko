NPX		:= npx
NODE  	:= node
NPM		:= npm

# Some make settings
SHELL := bash
.ONESHELL:
MAKEFLAGS += --warn-undefined-variables
MAKEFLAGS += --no-builtin-rules

packages 		:= $(wildcard packages/*)
package_jsons 	:= $(wildcard packages/*/package.json)
packages_tests	:= $(packages:packages/%=test/%)

default: all

all::
	make -j8 $(packages)
	make -j8 $(package_jsons)

.PHONY: $(packages)
$(packages):
	cd $@; make

test: $(packages_tests)

#
# make test/{package}
#
# make test/utils
#
$(packages_tests):
	cd packages/`basename $@`; make test


lint:
	$(NPX) standard

repackage: $(package_jsons)

$(package_jsons): tools/repackage.mjs
	cd $(shell dirname $@); PKG=`dirname $@` make repackage

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
