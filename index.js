import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import joi from "joi";
import dayjs from "dayjs";
import "dayjs/locale/pt-br.js";
import dotenv from "dotenv"

dotenv.config();

const timestamp = Date.now()
const date = dayjs().format('hh:mm:ss')

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
        return newFinding;
    } catch (error) {
        return console.error(`Erro.`)
    }

}
server.post(`/participants`,async (req,res) => {
    const { name } = req.body;
    console.log(req.body)
    const postSchema = joi.object({
        name: joi.string().min(1).max(30).required()
    })
    const validation = postSchema.validate(req.body)
    if(await userExist(name) > 0) {
        return res.sendStatus(409)
    }
    else if (validation.error) {
        return res.sendStatus(422)
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
server.post(`/messages`,async (req,res) => {
    const {to, text, type} = req.body
    const {user} = req.headers
    const messagesSchema = joi.object({
        to: joi.string().min(1).max(30).required(),
        text: joi.string().min(1).max(30).required(),
        type: joi.string().valid('message','private_message').required()
    })
    const validation = messagesSchema.validate(req.body);
    if (validation.error) {
        return res.sendStatus(422)
    }
    else if (await userExist(user) === 0) {
        return res.status(422).send({message:`Nome de participante inexistente.`})
    }
    await db.collection("messages").insertOne({to: to, text: text, type: type, from: user, time: date})
    res.sendStatus(201)
})
//QUERY STRING GET MESSAGES PAREI AQUI.
server.get(`/messages`, async (req,res) => {
    const list = await db.collection("messages").find().toArray();
    const newList = list.map(value => ({...value,_id: undefined}))
    res.send(newList)
})
server.post(`/status`,(req,res) => {
    res.send({message: `OK!`})
})













server.listen(4000,() => {
    console.log(`Listening on port 4000`)
})