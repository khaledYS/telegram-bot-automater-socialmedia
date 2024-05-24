import serverless from "serverless-http";
import express from "express";
import { bot } from "../../src/index";
import cors from "cors";
const app = express();
const router = express.Router();
require("dotenv").config();
const token = process.env.TOKEN;
app.use(cors())
app.use(express.json())

router.post(`/${token}`, async (req, res)=>{
    try{
        const message = req.body ;
        await bot.handleUpdate(message)
        res.status(200).json({body: ""})
    }catch(err){
        console.log(err);
        res.status(409).json({body:"error didn't find out "})
    }
})
router.get("/", async(req, res)=>{
    console.log('resvii')
    res.status(200).json({hi:"hi"})
})

// setting up the express app
app.use("/.netlify/functions/bot", router)

export const handler = serverless(app)