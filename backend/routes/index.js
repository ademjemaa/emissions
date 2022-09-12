import express from "express";
var router = express.Router();
import {getCountries, getEmissions, getAverage} from "../controllers/emissions.js"

/* GET home page. */
router.get("/emissions", getEmissions);
router.get("/countries", getCountries);
router.post("/average", getAverage);

export default router;
