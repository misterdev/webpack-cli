
import chalk from "chalk";
import * as logSymbols from "log-symbols";
import * as path from "path";

import Generator = require("yeoman-generator");

import { getPackageManager } from "@webpack-cli/utils/package-manager";
import { Confirm, Input, List } from "@webpack-cli/webpack-scaffold";

import { WebpackOptions } from "./types";
import entryQuestions from "./utils/entry";
import getBabelPlugin from "./utils/module";
import styleQuestionHandler, { ILoader, StylingType } from "./utils/style";
import tooltip from "./utils/tooltip";

/**
 *
 * Generator for initializing a webpack config
 *
 * @class 	InitGenerator
 * @extends Generator
 * @returns {Void} After execution, transforms are triggered
 *
 */
export default class InitGenerator extends Generator {
	public usingDefaults: boolean;
	private isProd: boolean;
	private dependencies: string[];
	private configuration: {
		config: {
			configName?: string;
			topScope?: string[];
			webpackOptions?: WebpackOptions;
		};
	};

	public constructor(args, opts) {
		super(args, opts);
		this.usingDefaults = false,
		this.isProd = this.usingDefaults ? true : false;

		this.dependencies = [
			"webpack",
			"webpack-cli",
			"babel-plugin-syntax-dynamic-import",
		];
		if (this.isProd) {
			this.dependencies.push("terser-webpack-plugin");
		} else {
			this.dependencies.push("webpack-dev-server");
		}

		this.configuration = {
			config: {
				configName: this.isProd ? "prod" : "config",
				topScope: [],
				// tslint:disable: object-literal-sort-keys
				webpackOptions: {
					mode: this.isProd ? "'production'" : "'development'",
					entry: undefined,
					output: undefined,
					plugins: [],
					module: {
						rules: [],
					},
				},
				// tslint:enable: object-literal-sort-keys
			},
		};

		// add splitChunks options for transparency
		// defaults coming from: https://webpack.js.org/plugins/split-chunks-plugin/#optimization-splitchunks
		this.configuration.config.topScope.push(
			"const path = require('path');",
			"const webpack = require('webpack');",
			"\n",
			tooltip.splitChunks(),
		);

		if (this.isProd) {
			this.configuration.config.topScope.push(
				tooltip.terser(),
				"const TerserPlugin = require('terser-webpack-plugin');",
				"\n",
			);
		}

		this.configuration.config.webpackOptions.plugins.push(
			"new webpack.ProgressPlugin()",
		);

		let optimizationObj;

		if (!this.isProd) {
			optimizationObj = {
				splitChunks: {
					chunks: "'all'",
				},
			};
		} else {
			optimizationObj = {
				minimizer: [
					"new TerserPlugin()",
				],
				splitChunks: {
					cacheGroups: {
						vendors: {
							priority: -10,
							test: "/[\\\\/]node_modules[\\\\/]/",
						},
					},
					chunks: "'async'",
					minChunks: 1,
					minSize: 30000,
					// for production name is recommended to be off
					name: !this.isProd,
				},
			};
		}

		this.configuration.config.webpackOptions.optimization = optimizationObj;

		if (!this.isProd) {
			this.configuration.config.webpackOptions.devServer = {
				open: true,
			};
		}
	}

	// eslint-disable-next-line
	public prompting(): any {
		const done: () => void | boolean = this.async();
		const self: this = this;
		let regExpForStyles: string;
		let ExtractUseProps: ILoader[];

		process.stdout.write(
			`\n${logSymbols.info}${chalk.blue(" INFO ")} ` +
			`For more information and a detailed description of each question, have a look at: ` +
			`${chalk.bold.green("https://github.com/webpack/webpack-cli/blob/master/INIT.md")}\n`,
		);
		process.stdout.write(
			`${logSymbols.info}${chalk.blue(" INFO ")} ` +
			`Alternatively, run "webpack(-cli) --help" for usage info\n\n`,
		);

		return this.prompt([
				Confirm("multiEntries", "Will your application have multiple bundles?", false),
			])
			.then((multiEntriesAnswer: {
				multiEntries: boolean,
			}) =>
				entryQuestions(self, multiEntriesAnswer.multiEntries),
			)
			.then((entryOption: object | string) => {
				if (typeof entryOption === "string" && entryOption.length > 0) {
					this.configuration.config.webpackOptions.entry = `${entryOption}`;
				} else if (typeof entryOption === "object") {
					this.configuration.config.webpackOptions.entry = entryOption;
				}
			})
			.then(() =>
				this.prompt([
					Input(
						"outputDir",
						"In which folder do you want to store your generated bundles?",
						"dist",
					),
				]),
			)
			.then((outputDirAnswer: {
				outputDir: string;
			}) => {
				// As entry is not required anymore and we dont set it to be an empty string or """""
				// it can be undefined so falsy check is enough (vs entry.length);
				if (
					!this.configuration.config.webpackOptions.entry &&
					!this.usingDefaults
				) {
					this.configuration.config.webpackOptions.output = {
						chunkFilename: "'[name].[chunkhash].js'",
						filename: "'[name].[chunkhash].js'",
					};
				} else if (!this.usingDefaults) {
					this.configuration.config.webpackOptions.output = {
						filename: "'[name].[chunkhash].js'",
					};
				}
				if (!this.usingDefaults && outputDirAnswer.outputDir.length) {
					this.configuration.config.webpackOptions.output.path =
						`path.resolve(__dirname, '${outputDirAnswer.outputDir}')`;
				}
			})
			.then(() =>
				this.prompt([
					Confirm("useBabel", "Will you be using ES2015?"),
				]),
			)
			.then((useBabelAnswer: {
				useBabel: boolean;
			}) => {
				if (useBabelAnswer.useBabel) {
					this.configuration.config.webpackOptions.module.rules.push(
						getBabelPlugin(),
					);
					this.dependencies.push(
						"babel-loader",
						"@babel/core",
						"@babel/preset-env",
					);
				}
			})
			.then(() =>
				this.prompt([
					List("stylingType", "Will you use one of the below CSS solutions?", [
						"No",
						StylingType.CSS,
						StylingType.SASS,
						StylingType.LESS,
						StylingType.PostCSS,
					]),
				]))
			.then((stylingTypeAnswer: {
				stylingType: string;
			}) =>
				({ ExtractUseProps, regExpForStyles } = styleQuestionHandler(self, stylingTypeAnswer.stylingType)),
			)
			.then(() => {
				if (this.isProd) {
					// Ask if the user wants to use extractPlugin
					return this.prompt([
						Input(
							"useExtractPlugin",
							"If you want to bundle your CSS files, what will you name the bundle? (press enter to skip)",
						),
					]);
				}
			})
			.then((useExtractPluginAnswer: {
				useExtractPlugin: string;
			}) => {
				if (regExpForStyles) {
					if (this.isProd) {
						const cssBundleName: string = useExtractPluginAnswer.useExtractPlugin;
						this.dependencies.push("mini-css-extract-plugin");
						this.configuration.config.topScope.push(
							tooltip.cssPlugin(),
							"const MiniCssExtractPlugin = require('mini-css-extract-plugin');",
							"\n",
						);
						if (cssBundleName.length !== 0) {
							this.configuration.config.webpackOptions.plugins.push(
								// TODO: use [contenthash] after it is supported
								`new MiniCssExtractPlugin({ filename:'${cssBundleName}.[chunkhash].css' })`,
							);
						} else {
							this.configuration.config.webpackOptions.plugins.push(
								"new MiniCssExtractPlugin({ filename:'style.css' })",
							);
						}

						ExtractUseProps.unshift({
							loader: "MiniCssExtractPlugin.loader",
						});
					}

					this.configuration.config.webpackOptions.module.rules.push(
						{
							test: regExpForStyles,
							use: ExtractUseProps,
						},
					);
				}

				done();
			});
	}

	public installPlugins() {
		const packager = getPackageManager();
		const opts: {
			dev?: boolean,
			"save-dev"?: boolean,
		} = packager === "yarn" ?
			{ dev: true } :
			{ "save-dev": true };

		this.scheduleInstallTask(packager, this.dependencies, opts);
	}

	public writing(): void {
		this.config.set("configuration", this.configuration);

		const packageJsonTemplatePath = "./templates/package.json.js";
		this.fs.extendJSON(this.destinationPath("package.json"), require(packageJsonTemplatePath)(this.isProd));

		const entry = this.configuration.config.webpackOptions.entry;
		const generateEntryFile = (entryPath: string, name: string) => {
			entryPath = entryPath.replace(/'/g, "");
			this.fs.copyTpl(
				path.resolve(__dirname, "./templates/index.js"),
				this.destinationPath(entryPath),
				{ name },
			);
		};

		if ( typeof entry === "string" ) {
			generateEntryFile(entry, "your main file!");
		} else if (typeof entry === "object") {
			Object.keys(entry).forEach((name) =>
				generateEntryFile(entry[name], `${name} main file!`),
			);
		}
	}
}
