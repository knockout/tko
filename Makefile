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

# Instrumentalization via CLI: $(LERNA) exec --stream -- $(NPX) instrument dist --in-place
# We have done it with a Esbuild-Plugin in the karma.conf.js-file
# To manually merge coverage files: $(NPX) nyc merge coverage ../../coverage-temp/coverage-final.json
test-coverage:
	$(LERNA) exec --stream -- $(MAKE) test-coverage   
	$(NPX) nyc report --reporter=html --reporter=text --reporter=cobertura --report-dir=coverage --temp-dir=coverage-temp --exclude="**/browser.min.js" --exclude="**/spec/*" > COVERAGE.md

test-headless-jquery:
	$(LERNA) exec --stream -- $(MAKE) test-headless-jquery

test-headless-ff:
	$(LERNA) exec --stream -- $(MAKE) test-headless-ff

ci:
	$(LERNA) exec --stream --concurrency=1 -- $(MAKE) test-ci

format:
	$(NPX) prettier . --check

format-fix:
	$(NPX) prettier . --write

tsc:
	$(NPX) tsc

eslint:
	$(NPX) eslint .

eslint-fix:
	$(NPX) eslint . --fix
	
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
	rm -rf coverage/
	rm -rf coverage-temp/
	
clean: sweep
	rm -rf node_modules/
	rm -f package-lock.json
	rm -rf packages/*/package-lock.json
	rm -rf builds/*/package-lock.json


# Local linking of these packages, so they
# are available for local testing/dev.
link:
	$(LERNA) exec --stream -- npm link
