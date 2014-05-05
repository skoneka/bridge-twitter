MOCHA=NODE_ENV=development ./node_modules/.bin/mocha

test:
	@$(MOCHA) --reporter list

test-record:
	@REPLAY_MODE=record $(MOCHA) --reporter list

test-coverage:
	@$(MOCHA) --reporter html-cov --require blanket > coverage.html
	open coverage.html

.PHONY: test
