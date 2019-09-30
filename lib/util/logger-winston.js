/* eslint no-console:0 */

const winston = require('winston')
const path = require('path')
const fs = require('fs')

const TransportTypes = {
  FILE      : 'file',
  LOGSTASH  : 'logstash',
  PAPERTRAIL: 'papertrail',
  CORALOGIX : 'coralogix'
}

const Transports = {
  [TransportTypes.FILE]: options => {
    require('winston-daily-rotate-file')

    if (options.filename) {
      options.filename = path.resolve(options.filename)
    }

    if (options.dirname) {
      options.dirname = path.resolve(options.dirname)
    }

    const transporter = new winston.transports.DailyRotateFile(options)

    if (fs.existsSync(transporter.dirname)) {
      return transporter
    }

    console.log(
      `FILE Transport is not applied, directory: ${transporter.dirname} doesn't not exist`,
      `options: ${JSON.stringify(options)}`
    )
  },

  [TransportTypes.LOGSTASH]: options => {
    const LogstashProvider = require('winston-logstash').Logstash

    const transporter = new LogstashProvider(options)

    transporter.on('error', error => {
      console.error('Logstash Transport', error)
    })

    console.log(`Logstash Transport is applied: ${JSON.stringify(options)}`)

    return transporter
  },

  [TransportTypes.PAPERTRAIL]: options => {
    const PapertrailProvider = require('winston-papertrail').Papertrail

    const transporter = new PapertrailProvider(options)

    transporter.on('error', error => {
      console.error('Papertrail Transport', error)
    })

    console.log(`Papertrail Transport is applied: ${JSON.stringify(options)}`)

    return transporter
  },

  [TransportTypes.CORALOGIX]: options => {
    const CoralogixWinston = require('coralogix-logger-winston')

    CoralogixWinston.CoralogixTransport.configure(options)

    const transporter = new CoralogixWinston.CoralogixTransport({
      category: 'CATEGORY'
    })

    transporter.on('error', error => {
      console.error('Coralogix Transport', error)
    })

    console.log(`Coralogix Transport is applied: ${JSON.stringify(options)}`)

    return transporter
  }
}

const AVAILABLE_TRANSPORT_TYPES = Object.keys(Transports)

const DefaultOptions = {
  [TransportTypes.FILE]: {
    json                           : false,
    timestamp                      : true,
    handleExceptions               : true,
    humanReadableUnhandledException: true,
    maxsize                        : 20 * 1024 * 1024, // = 20 Mb,
    maxFiles                       : 20,
    filename                       : './.log',
    datePattern                    : 'js-coderunner-yyyy-MM-dd',
    prepend                        : true,
  },

  [TransportTypes.LOGSTASH]: {
    timestamp                      : true,
    handleExceptions               : true,
    humanReadableUnhandledException: true,
    node_name                      : 'backendless-js-coderunner',
    port                           : 10514,
    host                           : '127.0.0.1'
  },

  [TransportTypes.PAPERTRAIL]: {
    hostname: 'backendless-js-coderunner',
    host    : '127.0.0.1'
  },
}

function getLoggers(loggersConfig) {
  const loggers = []

  if (loggersConfig) {
    AVAILABLE_TRANSPORT_TYPES.forEach(transportType => {
      const options = loggersConfig[transportType]

      if (options) {
        if (typeof options !== 'boolean' && typeof options !== 'object') {
          throw new Error(
            'Logger Transport Options is invalid, must be one of ["true", Object].'
          )
        }

        loggers.push({
          type   : transportType,
          options: typeof options === 'object'
            ? Object.assign({}, DefaultOptions[transportType], options)
            : DefaultOptions[transportType]
        })
      }
    })
  }

  return loggers
}

module.exports = function createLogger(loggersConfig) {
  const loggers = getLoggers(loggersConfig)

  if (loggers.length) {
    const transports = []

    loggers.forEach(({ type, options }) => {
      const transport = Transports[type](options)

      if (transport) {
        transports.push(transport)
      }
    })

    if (transports.length) {
      return new winston.Logger({ transports })
    }
  }
}

