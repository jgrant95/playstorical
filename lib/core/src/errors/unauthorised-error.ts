import { CustomError } from "./custom-error"

export class UnauthorisedError extends CustomError {
    statusCode = 401
    static message = `Not authorised`

    constructor() {
        super(UnauthorisedError.message)


    Object.setPrototypeOf(this, UnauthorisedError.prototype)
    }

    getErrors() {
        return [{ message: `Not authorised. ${this.message}` }]
    }
}