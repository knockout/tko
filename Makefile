NODE  	:= npx

default: build

.PHONY: test
test:
	$(NODE) lerna exec --concurrency=1 --loglevel=warn -- yarn test

.PHONY: testn
testn:
	$(NODE) lerna exec --concurrency=6 --loglevel=warn -- yarn test

.PHONY: build
build: node_modules
	$(NODE) lerna exec --concurrency=6 --loglevel=warn -- yarn build

.PHONY: lint
lint:
	$(NODE) standard

.PHONY: repackage
repackage:
	$(NODE) ./tools/common-package-config.js packages/shared.package.json packages/*/package.json

.PHONY: bootstrap
bootstrap:
	$(NODE) lerna bootstrap

node_modules: bootstrap
	$(NODE) yarn install

all: build test