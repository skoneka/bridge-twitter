test:
	./node_modules/.bin/mocha \
	  --reporter list

test-coverage:
	./node_modules/.bin/mocha --reporter html-cov --require blanket > coverage.html
	open coverage.html

.PHONY: test
