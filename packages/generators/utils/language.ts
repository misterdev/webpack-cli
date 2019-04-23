export enum LangType {
	ES6 = "ES6",
	Typescript = "Typescript",
}

interface IModuleRule extends Object {
	include: string[];
	loader: string;
	options: {
		plugins: string[];
		presets: Array<Array<string | object>>;
	};
	test: string;
}

/**
 *
 * Returns an module.rule object that has the babel loader if invoked
 *
 * @returns {Function} A callable function that adds the babel-loader with env preset
 */
export function getBabelPlugin(): IModuleRule {
	return {
		include: ["path.resolve(__dirname, 'src')"],
		loader: "'babel-loader'",
		options: {
			plugins: [
				"'syntax-dynamic-import'",
			],
			presets: [
				[
					"'@babel/preset-env'",
					{
						"'modules'": false,
					},
				],
			],
		},
		test: `${new RegExp(/\.js$/)}`,
	};
}

export default function language(self, langType) {
	switch (langType) {
		case LangType.ES6:
			self.configuration.config.webpackOptions.module.rules.push(
				getBabelPlugin(),
			);
			self.dependencies.push(
				"babel-loader",
				"@babel/core",
				"@babel/preset-env",
			);
			break;
		case LangType.Typescript:
			break;
	}
}
