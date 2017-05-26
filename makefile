SHELL := /bin/bash
PATH  := node_modules/.bin:$(PATH)
APP   := dist/decorators.js
TESTS := dist/test.js
SRC   := src/decorators-js.js
TES   := spec/test.js
MIN   := dist/decorators.min.js
all: $(MIN) $(TESTS)

clean:
	rm -r dist

install:
	@npm install

test:
	jasmine

serve:
	python3 -m http.server 8080

$(MIN): $(APP)
	uglifyjs -cmo $@ $<

$(APP): $(SRC)
	@mkdir -p $(@D)
	babel $< -o $@

$(TESTS): $(TES)
	@mkdir -p $(@D)
	babel $< -o $@

.PHONY: all clean install build serve test
