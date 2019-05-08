import { format, transports, loggers } from 'winston'
import WalletHelper from './Helper'

require('winston-daily-rotate-file')

/** Logger class */
export default class Logger {
    /**
     * Create winston rotate file transport
     * @return {object} winston file transport
     */
    static fileTransport() {
        return new transports.DailyRotateFile({
            level: 'info',
            filename: 'wanWalletMain-%DATE%.log',
            dirname: WalletHelper.getLogPath(),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            handleExceptions: true,
            json: true,
            format: format.combine(
                format.timestamp(),
                format.printf(Logger.logFormatTemplate)
            )
        });
    }

    /**
     * Create winston console transport
     * @return {object} winston console transport
     */
    static consoleTransport() {
        return new transports.Console({
            level: 'debug',
            handleExceptions: true,
            json: false,
            format: format.combine(
                format.timestamp(),
                format.colorize(),
                format.cli(),
                format.printf(Logger.logFormatTemplate)
            ),
        });
    }

    /**
     * Self-defined log entry template
     * @param {object} i - input stream
     */
    static logFormatTemplate(i) {
        return `${i.timestamp} ${i.level} [${i.label}] ${i.message}`;
    }

    /**
     * Create a logger with custom label, 
     * add it to logger set if not created before
     * @param {string} label - logger label
     * @return {object} A winston logger instance
     */
    static getLogger(label) {
        if (!loggers.has(label)) {
            loggers.add(label, {
                transports: [Logger.fileTransport(), Logger.consoleTransport()],
                format: format.label({ label })
            })
        }
        return loggers.get(label);
    }
}
