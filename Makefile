NPX		:= npx
NODE  	:= node
NPM		:= npm
LERNA	:= npx lerna

# Some make settings
SHELL := bash
.ONESHELL:
MAKEFLAGS 	+= --warn-undefined-variables
MAKEFLAGS 	+= --no-builtin-rules
CONCURRENCY = 8

default: all

package.json:

node_modules: package-lock.json

all:: node_modules
	$(LERNA) --concurrency $(CONCURRENCY) exec --stream -- $(MAKE)

test:
	$(LERNA) exec --stream -- $(MAKE) test

ci:
	$(LERNA) exec --stream --concurrency=1 -- $(MAKE) test-ci

lint:
	$(NPX) standard

repackage: tools/repackage.mjs
	$(LERNA) exec --stream -- $(MAKE) repackage

bump:
	$(LERNA) version

# from-git "identify packages tagged by lerna version and publish them to npm."
# from-package "packages where the latest version is not present in the registry"
publish-unpublished: build
	$(LERNA) publish from-package

package-lock.json: package.json packages/*/package.json
	$(NPM) i

package.json:

install: node_modules

outdated-list:
	$(NPM) outdated

outdated-upgrade:
	$(NPM) upgrade-interactive --latest

install: package-lock.json

clean:
	rm -f package-lock.json
	rm -rf packages/*/dist/*
	rm -rf packages/*/package-lock.json
	rm -rf builds/*/dist/*
	rm -rf builds/*/package-lock.json

# Local linking of these packages, so they
# are available for local testing/dev.
link:
	$(LERNA) exec --stream -- npm link
