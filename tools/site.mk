#
# Site-related make targets
#


NODE_BIN 	:= ../../node_modules/.bin
ESBUILD 	:= $(NODE_BIN)/esbuild
PORT		:= 8080

dist := dist/entry.js dist/index.html

all: build

dist/:
	mkdir -p dist

src/index.html:

dist/entry.js: src/entry.tsx dist/
	$(ESBUILD) src/entry.tsx \
		--bundle \
		--format=esm \
		--sourcemap \
		--metafile=dist/meta.json \
		--outfile=dist/entry.js

dist/index.html: src/index.html dist/
	ln -sf ../src/index.html dist/index.html

.PHONY: BUILD
build:: dist/index.html dist/entry.js

.PHONY: clean
clean:
	rm -rf dist/*

.PHONY: serve
serve: build
	$(ESBUILD) src/entry.tsx \
		--bundle \
		--format=esm \
		--sourcemap \
		--metafile=dist/meta.json \
		 --servedir=dist --serve=$(PORT) \
		--outfile=dist/entry.js
