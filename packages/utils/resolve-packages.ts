import chalk from "chalk";
import * as path from "path";

import modifyConfigHelper from "./modify-config-helper";
import { getPathToGlobalPackages } from "./package-manager";
import { spawnChild } from "./package-manager";
import { isLocalPath } from "./path-utils";

interface ChildProcess {
	status: number;
}

/**
 *
 * Attaches a promise to the installation of the package
 *
 * @param {Function} child - The function to attach a promise to
 * @returns {Promise} promise - Returns a promise to the installation
 */

export function processPromise(child: ChildProcess): Promise<void> {
	return new Promise((resolve: () => void, reject: () => void): void => {
		if (child.status !== 0) {
			reject();
		} else {
			resolve();
		}
	});
}

/**
 *
 * Resolves and installs the packages, later sending them to @creator
 *
 * @param {String[]} pkg - The dependencies to be installed
 * @returns {Function|Error} creator - Builds
 * a webpack configuration through yeoman or throws an error
 */

export function resolvePackages(pkg: string[]): Function | void {
	Error.stackTraceLimit = 30;

	const packageLocations: string[] = [];

	function invokeGeneratorIfReady(): Function {
		if (packageLocations.length === pkg.length) {
			return modifyConfigHelper("init", null, null, packageLocations);
		}
	}

	pkg.forEach((scaffold: string): void => {
		// Resolve paths to modules on local filesystem
		if (isLocalPath(scaffold)) {
			let absolutePath: string = scaffold;

			try {
				absolutePath = path.resolve(process.cwd(), scaffold);
				require.resolve(absolutePath);
				packageLocations.push(absolutePath);
			} catch (err) {
				console.error(`Cannot find a generator at ${absolutePath}.`);
				console.error("\nReason:\n");
				console.error(chalk.bold.red(err));
				process.exitCode = 1;
			}

			invokeGeneratorIfReady();
			return;
		}

		// Resolve modules on npm registry
		processPromise(spawnChild(scaffold))
			.then((): void => {
				try {
					const globalPath: string = getPathToGlobalPackages();
					packageLocations.push(path.resolve(globalPath, scaffold));
				} catch (err) {
					console.error("Package wasn't validated correctly..");
					console.error("Submit an issue for", pkg, "if this persists");
					console.error("\nReason: \n");
					console.error(chalk.bold.red(err));
					process.exitCode = 1;
				}
			})
			.catch((err: string): void => {
				console.error("Package couldn't be installed, aborting..");
				console.error("\nReason: \n");
				console.error(chalk.bold.red(err));
				process.exitCode = 1;
			})
			.then(invokeGeneratorIfReady);
	});
}
