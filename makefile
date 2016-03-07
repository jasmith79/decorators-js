SHELL := /bin/bash
PATH  := node_modules/.bin:$(PATH)
APP   := dist/decorators.js
TESTS := dist/test.js
SRC   := src/decorators.es
TES   := spec/test.es
MIN   := dist/decorators.min.js
all: install clean build
clean:
	rm -r dist
install:
	@npm install
build: $(MIN) $(TESTS)
$(MIN): $(APP)
	uglifyjs -cmo $@ $<
$(APP): $(SRC)
	@mkdir -p $(@D)
	babel $< -o $@
$(TESTS): $(TES)
	@mkdir -p $(@D)
	babel $< -o $@
.PHONY: all clean install build test
