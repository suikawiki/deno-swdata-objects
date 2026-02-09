all: opentype.module.js

opentype.module.js:
	curl -sSfL https://raw.githubusercontent.com/manakai/opentypejs/refs/heads/master/dist/opentype.module.js > $@

## License: Public Domain.
