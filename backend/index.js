import "dotenv/config";

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

import indexRouter from "./routes/index.js";



const app = express();

app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

app.use('/', indexRouter);

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`SERVER RUNNING ON PORT: ${PORT}`))