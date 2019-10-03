/* eslint no-console:0 */

const stream = require('stream');
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
    if (options.filename) {
      options.filename = path.resolve(options.filename)
    }

    if (options.dirname) {
      options.dirname = path.resolve(options.dirname)
    }

    const transporter = new winston.transports.File(options)

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
    filename                       : './js-coderunner.log',
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

function getTransports(loggersConfig) {
  const transports = []

  if (loggersConfig) {
    AVAILABLE_TRANSPORT_TYPES.forEach(transportType => {
      const options = loggersConfig[transportType]

      if (options) {
        if (typeof options !== 'boolean' && typeof options !== 'object') {
          throw new Error(
            'Logger Transport Options is invalid, must be one of ["true", Object].'
          )
        }

        const transportOptions = typeof options === 'object'
          ? Object.assign({}, DefaultOptions[transportType], options)
          : DefaultOptions[transportType]

        transportOptions.level = options.level || 'info'

        transports.push({
          type   : transportType,
          options: transportOptions
        })
      }
    })
  }

  return transports
}

class LogStream extends stream.Transform {
  constructor({ level }) {
    super({
      readableObjectMode: true,
      writableObjectMode: true
    })

    this.level = level || 'info'
  }

  _transform(chunk, encoding, callback) {
    callback(null, {
      level  : this.level,
      message: Buffer.from(chunk).toString()
    })
  }
}

module.exports = function createLogger(loggersConfig) {
  const transports = []

  getTransports(loggersConfig).forEach(({ type, options }) => {
    const transport = Transports[type](options)

    if (transport) {
      transports.push(transport)
    }
  })

  if (transports.length) {
    transports.unshift(new winston.transports.Console())

    const logger = winston.createLogger({
      format: winston.format.printf(({ message }) => message),
      transports
    })

    const logStreams = {}

    logger.getLogStream = level => {
      if (!logStreams[level]){
        logStreams[level] = new LogStream({ level })
      }

      return logStreams[level]
    }

    logger.on('error', error => {
      process.stdout.write(error)
    })

    return logger
  }
}

