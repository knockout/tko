NPX		:= npx
NODE  	:= node
NPM		:= npm
LERNA	:= npx lerna
DOCKER	:= docker

# Some make settings
SHELL := bash
.ONESHELL:
MAKEFLAGS 	+= --warn-undefined-variables
MAKEFLAGS 	+= --no-builtin-rules
CONCURRENCY = 8

default: all

package.json:

node_modules: package-lock.json

all:: node_modules package-lock.json
	$(LERNA) --concurrency $(CONCURRENCY) exec --stream -- $(MAKE)

test:
	$(LERNA) exec --stream -- $(MAKE) test

test-headless:
	$(LERNA) exec --stream -- $(MAKE) test-headless

test-headless-jquery:
	$(LERNA) exec --stream -- $(MAKE) test-headless-jquery

ci:
	$(LERNA) exec --stream --concurrency=1 -- $(MAKE) test-ci

lint:
	$(NPX) standard

tsc:
	$(NPX) tsc

eslint:
	$(NPX) eslint .
	
dts:
	$(NPX) tsc --build tsconfig.dts.json

docker-build:
	$(DOCKER) build . --tag tko

# Run the `repackage` target in every directory.  Essentially
# homogenizes the `package.json`.
repackage: tools/repackage.mjs
	$(LERNA) exec --stream -- $(MAKE) repackage

# Run to update the versions of all the package.json files, before publishing.
bump:
	$(LERNA) version

# from-git "identify packages tagged by lerna version and publish them to npm."
# from-package "packages where the latest version is not present in the registry"
publish-unpublished: all link
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

sweep:
	rm -rf packages/*/dist/*
	rm -rf builds/*/dist/*
	
clean: sweep
	rm -rf node_modules/
	rm -f package-lock.json
	rm -rf packages/*/package-lock.json
	rm -rf builds/*/package-lock.json


# Local linking of these packages, so they
# are available for local testing/dev.
link:
	$(LERNA) exec --stream -- npm link
