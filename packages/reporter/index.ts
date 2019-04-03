const getLogger = require('webpack-log');
const webpack = require("webpack");
const Table = require('cli-table');

// A reporter could be a class or a function
class Reporter {

    name: string
    // logs emits event for every king of output
    logs: any
    // this is an instance of webpack-log
    logger: any

    constructor(name, logs) {
        this.name = name
        this.logs = logs
        this.logger = getLogger({ name })
    
        // We listen for every kind of output we want to handle
        this.logs.addListener('stats', this.onStats)
        this.logs.addListener('error', this.onError)
        this.logs.addListener('warn', this.onWarning)
        this.logs.addListener('info', this.onInfo)
    }

    onStats = (stats, options) => {
        this._printStats(stats, options)
    }

    onError = (error) => {
        this.logger.error(error)
    }
    
    onWarning = (warn) => {
        this.logger.warn(warn)
    }
    
    onInfo = (info) => {
        this.logger.info(info)
    }

    // This is the function that we currently use for logging stats
    _printStats(stats, outputOptions) {
        if (outputOptions.version) {
            console.log(`webpack ${webpack.version}`);
            process.exit(0);
        }
        const statsObj = stats.toJson(outputOptions);
        const { assets, entrypoints, time, builtAt} = statsObj;
    
        this.logger.info(`Built ${new Date(builtAt).toString()}`);
        this.logger.info(`Compile Time ${time}ms\n`);
        
        let entries: Array<string> = new Array<string>();
        Object.keys(entrypoints).forEach(entry => {
            entries = entries.concat(entrypoints[entry].assets)
        })
        // TODO: Abstract to own lib
        const table = new Table({
            head: ['', 'Name', 'Size(±)'],
            colWidths: [3, 50, 40],
            style : {compact : true, 'padding-left' : 1}
        });
    
        assets.forEach(asset => {
            if(entries.includes(asset.name)) {
                const kbSize = `${Math.round(asset.size/1000)} kb`
                const emittedSign = asset.emitted === true ? '✓' : '✗'
                table.push([emittedSign, asset.name, kbSize]);
            }
        })
        this.logger.info(`\n${table.toString()}`)
    }
}

module.exports = Reporter;