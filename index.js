import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import joi from "joi";
import dayjs from "dayjs";
import "dayjs/locale/pt-br.js";
import dotenv from "dotenv";
import {stripHtml} from "string-strip-html";

dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);

let db;

mongoClient.connect().then(() => {
    db = mongoClient.db(`uol`)
})

const server = express();

server.use(cors());
server.use(express.json());

const postSchema = joi.object({
    name: joi.string().min(1).max(30).required()
})

const messagesSchema = joi.object({
    to: joi.string().min(1).max(30).required(),
    text: joi.string().min(1).required(),
    type: joi.string().valid('message','private_message').required()
})

setInterval(async () => {
    const time = Date.now() - 10000;
    try {
        const findingUser = await db.collection('participants').find({lastStatus: {$lte: time}}).toArray();
        if (findingUser.length > 0) {
            const findingserMap = findingUser.map(value => {
                return {
                    from: value.name,
                    to: "Todos",
                    text: "sai da sala",
                    type: "status",
                    time: dayjs().format("hh:mm:ss"),
                }
            })
            await db.collection('participants').insertMany(findingserMap)
            await db.collection('participants').deleteMany({lastStatus: {$lte: time}});
        }
    } catch (error) {
        return console.error(`Error in the process of removing`)
    }
}
,15000)

const userExist = async (name) => {
    
    try {
        const finding = await db.collection(`participants`).find().toArray();
        const newFinding = finding.filter(value => value.name === name).length;
        return newFinding;
    } catch (error) {
        return console.error(`Erro.`);
    }

}

server.post(`/participants`,async (req,res) => {
    const { name } = req.body;
    const validation = postSchema.validate(req.body);
    const newname = stripHtml(name).result.trim();
    if(await userExist(newname) > 0) {
        return res.sendStatus(409);
    }
    else if (validation.error) {
        return res.sendStatus(422);
    }
    try {
        if(await userExist(newname) === 0) {
            await db.collection("participants").insertOne({from: newname, to: 'Todos', text: 'entra na sala...', type: 'status', time: dayjs().format("hh:mm:ss")});
            await db.collection("participants").insertOne({name: newname, lastStatus: Date.now()});
            return res.sendStatus(201);
    }

    } catch (error) {
        return res.sendStatus(500);
    }

})
server.get(`/participants`,async (req,res) => {

    const list = await db.collection("participants").find().toArray();
    const newList = list.map(value => ({...value,_id: undefined}));
    res.send(newList);
})
server.post(`/messages`,async (req,res) => {
    const {to, text, type} = req.body;
    const {user} = req.headers;
    const newto = stripHtml(to).result.trim();
    const newtext = stripHtml(text).result.trim();
    const newtype = stripHtml(type).result.trim();
    const newuser = stripHtml(user).result.trim();

    const validation = messagesSchema.validate(req.body);
    if (validation.error) {
        return res.sendStatus(422)
    }
    else if (await userExist(newuser) === 0) {
        return res.status(422).send({message:`Nome de participante inexistente.`})
    }
    try {
        await db.collection("messages").insertOne({to: newto, text: newtext, type: newtype, from: newuser, time: dayjs().format("hh:mm:ss")})
        return res.sendStatus(201)
    } catch (error) {
        return res.sendStatus(500)
    }
})

server.get(`/messages`, async (req,res) => {
    const {limit} = req.query;
    const {user} = req.headers;

    try {
        const list = await db.collection("messages").find().toArray();
        const newList = list.map(value => ({...value,_id: undefined}))
        const newReceived = newList.filter(value => {
            if ((value.to === user || value.from === user) && value.type === "private_message") {
                return value;
            }
            else if (value.type === "message") {
                return value;
            }
        })
        if (limit !== undefined && Number(limit) !== NaN) {
            const numberLimit = newReceived.splice(-(Number(limit)));
            return res.send(numberLimit)
        }
        else if (limit === undefined) {
            return res.send(newReceived)
        }
    } catch (error) {
        return res.sendStatus(500)
    }

})
server.post(`/status`,async (req,res) => {
    const {user} = req.headers;
    if (await userExist(user) === 0) {
        return res.sendStatus(404)
    }
    try {
        const finder = await db.collection(`participants`).findOne({name: user})
        if(!finder) {
            return res.sendStatus(404);
        }
        await db.collection(`participants`).updateOne({_id:finder.id},{$set:{...finder,lastStatus: Date.now()}})
        return res.sendStatus(200)
    } catch (error) {
        return res.sendStatus(500)
    }
    
})
server.delete(`/messages/:id`, async (req,res) => {
    const {user} = req.headers;
    const {id} = req.params;
    if (await userExist(user) <= 0) {
        return res.sendStatus(422);
    }
    try {
            const finder = await db.collection('messages').findOne({_id: ObjectId(id)})
            if (!finder) {
                return res.sendStatus(404);
            }
            await db.collection('messages').deleteOne({_id: ObjectId(id)})
            return res.sendStatus(200);
    } catch (error) {
        return res.sendStatus(500);
    }
})
server.put(`/messages/:id`, async (req,res) => {
    const {user} = req.headers;
    const {id} = req.params;
    const validation = messagesSchema.validate(req.body)
    if (await userExist(user) <= 0) {
        return res.sendStatus(422)
    }
    else if (validation.error) {
        return res.sendStatus(422)
    }
    try {
        const findmessage = await db.collection(`messages`).findOne({_id: ObjectId(id)})
        if (!findmessage) {
            return res.sendStatus(404)
        }
        else if (findmessage.from !== user) {
            return res.sendStatus(401)
        }
        await db.collection(`messages`).updateOne({_id: ObjectId(id)},{$set: req.body});
        return res.sendStatus(200)
    } catch (error) {
        return res.sendStatus(500)
    }
})
server.listen(5000,() => {
    console.log(`Listening on port 5000`)
})