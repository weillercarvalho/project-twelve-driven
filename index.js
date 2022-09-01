import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import Joi from "joi";
import dayjs from "dayjs";
import "dayjs/locale/pt-br.js";
import dotenv from "dotenv"

dotenv.config();

const timestamp = Date.now()

const date = dayjs().format('DD/MM/YY');

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => {
    db = mongoClient.db(`uol`)
})

const server = express();

server.use(cors());
server.use(express.json());




const userExist = async (name) => {
    
    try {
        const finding = await db.collection(`participants`).find().toArray();
        const newFinding = finding.filter(value => value.name === name).length;
        // console.log(newFinding)
        return newFinding;
    } catch (error) {
        return console.error(`Erro.`)
    }

}



server.post(`/participants`,async (req,res) => {
    const { name } = req.body;
    console.log(await userExist(name))
    const schema = Joi.object({
        username: Joi.string().min(1).max(30).required()
    })
    const { error } = schema.validate({username : name})
    if (error !== undefined) {
        return res.sendStatus(422)
    }
    else if(await userExist(name) > 0) {
        return res.sendStatus(409)
    }
    else if(await userExist(name) === 0) {
        await db.collection("participants").insertOne({from: name, to: 'Todos', text: 'entra na sala...', type: 'status', time: date})
    }
    await db.collection("participants").insertOne({name: name, lastStatus: timestamp})
    res.sendStatus(201)
})
server.get(`/participants`,async (req,res) => {

    const list = await db.collection("participants").find().toArray();
    const newList = list.map(value => ({...value,_id: undefined}))
    res.send(newList)
})
server.post(`/messages`,(req,res) => {
    res.send({message: `OK!`})
})
server.get(`/messages`,(req,res) => {
    res.send({message: `OK!`})
})
server.post(`/status`,(req,res) => {
    res.send({message: `OK!`})
})













server.listen(4000,() => {
    console.log(`Listening on port 4000`)
})