export interface GetErrors {
  message: string
  field?: string | undefined
}

export abstract class CustomError extends Error {
  abstract statusCode: number

  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, CustomError.prototype)
  }

  abstract getErrors(): GetErrors[]
}
