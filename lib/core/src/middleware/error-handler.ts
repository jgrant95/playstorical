import { NextFunction, Request, Response } from "express"
import { CustomError } from "../errors/custom-error"

export const errorHander = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof CustomError) {

    return res
      .status(err.statusCode)
      .send({ errors: err.getErrors(), message: err.message })
  }

  res.status(500).send({ message: err.message })
}
