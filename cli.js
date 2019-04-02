#!/usr/bin/env node

"use strict";

require("v8-compile-cache");

const importLocal = require("import-local");

// Prefer the local installation of webpack-cli
if (importLocal(__filename)) {
	return;
}
process.title = "webpack";

/*
	Very simple & ugly solution to get the name or the path of the reporter 
	reader-please-ignore-next-line: bad-code
*/
const reporter = process.argv.length == 4 ? process.argv[3]: "./packages/reporter"

// default reporter should be included from node_modules require('@webpack-cli/reporter')
process.reporter = require(reporter)({
	name: 'webpack'
});

const updateNotifier = require("update-notifier");
const packageJson = require("./package.json");

updateNotifier({ pkg: packageJson }).notify();

const semver = require("semver");

const version = packageJson.engines.node;

if (!semver.satisfies(process.version, version)) {
	const rawVersion = version.replace(/[^\d\.]*/, "");
	process.reporter.error(
		"webpack CLI requires at least Node v" +
			rawVersion +
			". " +
			"You have " +
			process.version +
			".\n" +
			"See https://webpack.js.org/ " +
			"for migration help and similar."
	);
	process.exit(1);
}

require("./lib/bootstrap");
