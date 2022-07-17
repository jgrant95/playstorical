import { CustomError, GetErrors } from "./custom-error";

export class NotFoundError extends CustomError {
  statusCode = 404

  constructor(public message: string) {
    super('Not found')

    Object.setPrototypeOf(this, NotFoundError.prototype)
  }

  getErrors(): GetErrors[] {
    return [{ message: `Not found. ${this.message}` }]
  }
}