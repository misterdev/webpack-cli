const webpack = require("webpack");

function invokeCompilerInstance(compiler, lastHash, options, outputOptions) {
	return compiler.run(function(err, stats) {
		return compilerCallback(compiler, err, stats, lastHash, options, outputOptions)
	});
}

function invokeWatchInstance(compiler, lastHash, options, outputOptions, watchOptions) {
	return compiler.watch(watchOptions, function(err, stats) {
		return compilerCallback(compiler,  err, stats, lastHash, options, outputOptions)
	});
}
function compilerCallback(compiler, err, stats, lastHash, options, outputOptions) {
	const stdout = options.silent
			? {
				write: () => {}
			  } // eslint-disable-line
			: process.stdout;
	if (!outputOptions.watch || err) {
		// Do not keep cache anymore
		compiler.purgeInputFileSystem();
	}
	if (err) {
		lastHash = null;
		process.reporter.error(err.stack || err);
		process.exit(1); // eslint-disable-line
	}
	if (outputOptions.json) {
		stdout.write(JSON.stringify(stats.toJson(outputOptions), null, 2) + "\n");
	} else if (stats.hash !== lastHash) {
		lastHash = stats.hash;
		if (stats.compilation && stats.compilation.errors.length !== 0) {
			const errors = stats.compilation.errors;
			if (errors[0].name === "EntryModuleNotFoundError") {
				process.reporter.error("Insufficient number of arguments or no entry found.")
				process.reporter.error("Alternatively, run 'webpack(-cli) --help' for usage info.");
			}
		}

		process.reporter.stats(stats, outputOptions);
		// generateOutput(outputOptions, stats);
	}
	if (!outputOptions.watch && stats.hasErrors()) {
		process.exitCode = 2;
	}
}

module.exports = function webpackInstance(opts) {
	const { outputOptions, processingErrors, options } = opts;

	if(!!outputOptions.colors) {
		require("supports-color").stdout
		outputOptions.colors = true;
	}
	if (outputOptions.help) {
		process.reporter.error(outputOptions.help);
		return;
	}

	if (processingErrors.length > 0) {
		throw new Error(result.processingErrors);
	}
	if (process.shouldUseMem) {
		// TODO: use memfs for people to use webpack with fake paths
	}
	let compiler;
	let lastHash = null;

	try {
		compiler = webpack(options);
	} catch (err) {
		if (err.name === "WebpackOptionsValidationError") {
			if (outputOptions.color)
				process.reporter.error(`\u001b[1m\u001b[31m${err.message}\u001b[39m\u001b[22m`);
			else process.reporter.error(err.message);
			// eslint-disable-next-line no-process-exit
			process.exit(1);
		}
		throw err;
	}


	console.log('\n')
	process.reporter.info(`webpack ${webpack.version}`);


	compiler.hooks.beforeRun.tap("webpackProgress", compilation => {
		if(outputOptions.progress) {
			const ProgressPlugin = webpack.ProgressPlugin;
			new ProgressPlugin().apply(compiler)
		}
	})

	if (outputOptions.infoVerbosity === "verbose") {
		if (outputOptions.watch) {
			compiler.hooks.watchRun.tap("WebpackInfo", compilation => {
				const compilationName = compilation.name ? compilation.name : "";
				process.reporter.info("Compilation " + compilationName + " starting…");
			});
		} else {
			compiler.hooks.beforeRun.tap("WebpackInfo", compilation => {
				const compilationName = compilation.name ? compilation.name : "";
				process.reporter.info("Compilation " + compilationName + " starting…");
			});
		}
		compiler.hooks.done.tap("WebpackInfo", compilation => {
			const compilationName = compilation.name ? compilation.name : "";
			process.reporter.info("Compilation " + compilationName + " finished");
		});
	}

	if (outputOptions.watch) {
		const watchOptions = outputOptions.watchOptions || {};
		if (watchOptions.stdin) {
			process.stdin.on("end", function(_) {
				process.exit(); // eslint-disable-line
			});
			process.stdin.resume();
		}
		invokeWatchInstance(compiler, lastHash, options, outputOptions, watchOptions);
		if (outputOptions.infoVerbosity !== "none") process.reporter.info("watching the files...");
	} else invokeCompilerInstance(compiler, lastHash, options, outputOptions);
	return compiler;
};
