const EventEmitter = require('events').EventEmitter;

class Logger {
    static info(...args) {
        Logger.logs.emit('info', ...args)
    }
    static warn(...args) {
        Logger.logs.emit('warn', ...args)
    }
    static error(...args) {
        Logger.logs.emit('error', ...args)
    }
    static stats(...args) {
        Logger.logs.emit('stats', ...args)
    }

    static get red() {
        return '\x1B[31m';
    }

    static get yellow() {
        return '\x1b[33m';
    }

    static get bold() {
        return '\x1b[1m';
    }   
}

Logger.logs = new EventEmitter();

module.exports = Logger