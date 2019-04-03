#!/usr/bin/env node

"use strict";

require("v8-compile-cache");

const importLocal = require("import-local");

// Prefer the local installation of webpack-cli
if (importLocal(__filename)) {
	return;
}
process.title = "webpack";

// We include the logger exposing the reporter API
const logger = require('./lib/utils/logger');
process.logger = logger;
// Very simple & ugly solution to get the name or the path of the reporter
// we can test it running webpack --reporter path/to/reporter
// reader-please-ignore-next-line: bad-code
const reporterPath = process.argv.length == 4 ? process.argv[3]: "./packages/reporter"
// default reporter should be included from node_modules require('@webpack-cli/reporter')
const Reporter = require(reporterPath);
// We don't really need this variable, but I've created it to keep a reference to the
// reporter/reporters. 
process.reporters = [
	new Reporter('webpack', logger.logs ),
	// we can have multiple reporters
	//new Reporter('webpack2', logger.logs )
];
// Some logs
process.logger.error('This is an error')
process.logger.warn('This is a warning')
process.logger.info('This is an info')

const updateNotifier = require("update-notifier");
const packageJson = require("./package.json");

updateNotifier({ pkg: packageJson }).notify();

const semver = require("semver");

const version = packageJson.engines.node;

if (!semver.satisfies(process.version, version)) {
	const rawVersion = version.replace(/[^\d\.]*/, "");
	process.logger.error(
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
