all: opentype.module.js

opentype.module.js:
	curl -sSfL https://raw.githubusercontent.com/manakai/opentypejs/refs/heads/master/dist/opentype.module.js > $@

#REV := $(shell git rev-parse HEAD)

build-deno: dist/main.js dist/opentype.module.js
dist/main.js: main.js
	mkdir -p dist
	cp $< $@
	sed -i "s/@@REV@@/rev2/g" $@
dist/opentype.module.js: opentype.module.js
	mkdir -p dist
	cp $< $@

# App Directory : (root)
# Framework preset : No Preset
# Build command : make build-deno
# Entrypoint : dist/main.js

## License: Public Domain.
