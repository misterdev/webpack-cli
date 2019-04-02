const getLogger = require('webpack-log');
const webpack = require("webpack");
const Table = require('cli-table');

interface Reporter {
    error: (error: string | string[]) => any,
    warn: (error: string | string[]) => any,
    stats: (stats: any, options: any) => any,
    info: (info: string | string[]) => any,
}

const reporter: (string) => Reporter = (name) => {
    const logger = getLogger(name)

    // This is the function that we currently use for logging stats
    function printStats(stats, outputOptions) {
        if (outputOptions.version) {
            console.log(`webpack ${webpack.version}`);
            process.exit(0);
        }
        const statsObj = stats.toJson(outputOptions);
        const { assets, entrypoints, time, builtAt} = statsObj;
    
        logger.info(`Built ${new Date(builtAt).toString()}`);
        logger.info(`Compile Time ${time}ms`);
        console.log('\n');
        
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
        logger.info(`\n${table.toString()}`)
    }

    return {
        error: (error) => logger.error(error),
        warn: (warn) => logger.warn(warn),
        info: (info) => logger.info(info),
        stats: (stats, outputOptions) => printStats(stats, outputOptions)
    }
}

module.exports = reporter;