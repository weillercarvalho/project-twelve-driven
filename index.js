import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import Joi from "joi";
import dayjs from "dayjs";
import 'dayjs/locale/pt-br.js';

const timestamp = Date.now()

const date = dayjs().format('DD/MM/YY');

console.log(date)

const server = express();

server.use(cors());
server.use(express.json());


const participants = [];
const messages = [];

const userExist = (name) => {
    return participants.filter(value => value.name === name)
}


server.post(`/participants`,(req,res) => {
    const { name } = req.body;
    console.log(userExist(name))
    participants.push({name});
    console.log(userExist(name))
    const schema = Joi.object({
        username: Joi.string().min(1).max(30).required()
    })
    const { error } = schema.validate({username : name})
    if (error !== undefined) {
        return res.sendStatus(422)
    }
    else if(userExist(name).length > 1) {
        return res.sendStatus(409)
    }
    res.sendStatus(201)
})
server.get(`/participants`,(req,res) => {
    res.send({message: `OK!`})
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