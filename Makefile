LERNA	:= bunx lerna
DOCKER	:= docker

# Some make settings
SHELL := bash
.ONESHELL:
MAKEFLAGS 	+= --warn-undefined-variables
MAKEFLAGS 	+= --no-builtin-rules
CONCURRENCY = 8

default: all

package.json:

node_modules: bun.lock

all:: node_modules bun.lock
	$(LERNA) --concurrency $(CONCURRENCY) exec --stream -- $(MAKE)

test test-headless test-headless-ff test-headless-jquery:
	bunx vitest run

format:
	bunx prettier . --check

format-fix:
	bunx prettier . --write

tsc:
	bunx tsc

eslint:
	bunx eslint .

eslint-fix:
	bunx eslint . --fix
	
dts:
	bunx tsc --build tsconfig.dts.json

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

bun.lock: package.json packages/*/package.json
	bun install

package.json:

install: node_modules

outdated-list:
	bun outdated

outdated-upgrade:
	bun upgrade-interactive --latest

install: bun.lock

sweep:
	rm -rf packages/*/dist/*
	rm -rf builds/*/dist/*
	rm -rf coverage/
	rm -rf coverage-temp/
	
clean: sweep
	rm -rf node_modules/
	rm -f bun.lock


# Local linking of these packages, so they
# are available for local testing/dev.
link:
	$(LERNA) exec --stream -- bun link
