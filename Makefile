SHELL := /bin/bash
PATH := node_modules/.bin:$(PATH)

public/app.js: client/app.jsx client/*.*
	browserify $< -t 6to5ify > $@
