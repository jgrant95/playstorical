import express from "express";
import asyncHandler from "express-async-handler"

import * as controller from '../controllers/snapshot'

const router = express.Router();

router.post('/capture', asyncHandler(controller.capture));

export = router