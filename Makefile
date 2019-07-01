NODE  	:= npx
LERNA 	:= $(NODE) lerna

default: build

.PHONY: test
test:
	$(LERNA) exec --concurrency=1 --loglevel=warn -- yarn test

.PHONY: testn
testn:
	$(LERNA) exec --concurrency=6 --loglevel=warn -- yarn test

.PHONY: build
build: node_modules
	$(LERNA) exec --concurrency=6 --loglevel=warn -- yarn build

.PHONY: lint
lint:
	$(NODE) standard

.PHONY: repackage
repackage:
	$(NODE) ./tools/common-package-config.js packages/shared.package.json packages/*/package.json

.PHONY: bootstrap
bootstrap:
	$(LERNA) bootstrap

.PHONY: bump
bump:
	$(LERNA) version

# from-git "identify packages tagged by lerna version and publish them to npm."
# from-package "packages where the latest version is not present in the registry"
publish-unpublished: build
	$(LERNA) publish from-package

node_modules: bootstrap
	$(NODE) yarn install

all: build test
