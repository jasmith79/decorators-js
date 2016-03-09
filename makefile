SHELL := /bin/bash
PATH  := node_modules/.bin:$(PATH)
APP   := dist/decorators.js
TESTS := dist/test.js
SRC   := src/decorators.es
TES   := spec/test.es
MIN   := dist/decorators.min.js
all: install clean build
test:
	phantomjs spec/run-jasmine.js spec/index.html
clean:
	rm -r dist
install:
	@npm install
#some tests are node-specific, rather than have to type node_modules/.bin/jasmine
jasmine:
	jasmine
build: $(MIN) $(TESTS)
$(MIN): $(APP)
	uglifyjs -cmo $@ $<
$(APP): $(SRC)
	@mkdir -p $(@D)
	babel $< -o $@
$(TESTS): $(TES)
	@mkdir -p $(@D)
	babel $< -o $@
.PHONY: all clean install build test jasmine
