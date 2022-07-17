import { createLogger, format, transports } from 'winston'

const service = process.env.SERVICE_NAME || 'service'

const customMessageFormat = format.printf(({ level, message, timestamp }) => `${timestamp} ${level}: ${message}`)
const colorizeFormat = format.colorize()

const verboseFormat = format.combine(
  format.timestamp({ format: 'DD/MM/YY HH:mm:ss' }),
  format.prettyPrint({ colorize: true }),
  colorizeFormat,
  customMessageFormat,
)

export const logger = createLogger({
    levels: {info: 2, warn: 1, error: 0 },
    format: format.json(),
    defaultMeta: { service },
    transports: [
      new transports.Console({
        format: verboseFormat
      })
    ],
  })