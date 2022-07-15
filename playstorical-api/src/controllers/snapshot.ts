import { Request } from "express";

import { capture } from "../services/snapshot.service";

export const captureRoute = async (req: Request, res, cache) => {
    try {
        const result = await capture(req.body, cache)

        if (result.ok === false) {
            console.log(`Failed to capture snapshot. Error: ${result.error}`)
            return res.status(400).send(result.error)
        }

        return res.status(200).json(result.message)
    }
    catch (err) {
        console.log(`Exception thrown. Failed to capture snapshot. Error: ${err}`)

        return res.status(500).send(err)
    }
}