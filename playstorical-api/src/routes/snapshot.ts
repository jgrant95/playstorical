import express from "express";
import asyncHandler from "express-async-handler"
import NodeCache from "node-cache";

import * as controller from '../controllers/snapshot'

const router = express.Router();

export const getSnapshotRoutes = (cache: NodeCache) => {
    router.post('/capture', asyncHandler((req, res) => controller.captureRoute(req, res, cache)));

    return router
}