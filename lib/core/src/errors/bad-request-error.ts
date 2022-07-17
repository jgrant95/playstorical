import { logger } from "../utils/logger";
import { CustomError } from "./custom-error";

export class BadRequestError extends CustomError {
  statusCode = 400

  constructor(public message: string) {
    super(message)

    logger.info(`Bad request error: ${message}`)
    Object.setPrototypeOf(this, BadRequestError.prototype)
  }

  getErrors() {
    return [{ message: `Bad request. ${this.message}` }]
  }
}