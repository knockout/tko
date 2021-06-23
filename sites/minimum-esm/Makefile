
NODE_BIN 	:= ../../node_modules/.bin
ESBUILD 	:= $(NODE_BIN)/esbuild
PORT		:= 8080

dist := dist/entry.js dist/index.html

all: build

src/index.html:

dist/entry.js: src/entry.tsx
	$(ESBUILD) src/entry.tsx \
		--bundle \
		--sourcemap \
		--metafile=dist/meta.json \
		--outfile=dist/entry.js

dist/index.html: src/index.html
	cp src/index.html dist/index.html

.PHONY: BUILD
build: dist/index.html dist/entry.js

.PHONY: serve
serve:
	$(ESBUILD) src/entry.tsx \
		--bundle \
		--sourcemap \
		--metafile=dist/meta.json \
		 --servedir=dist --serve=$(PORT) \
		--outfile=dist/entry.js
