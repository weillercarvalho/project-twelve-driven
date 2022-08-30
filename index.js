import express from "express";
import cors from "cors";


const server = express();

server.use(cors());
server.use(express.json());


server.post(`/participants`,(req,res) => {
    server.send({message: `OK!`})
})
server.get(`/participants`,(req,res) => {
    server.send({message: `OK!`})
})
server.post(`/messages`,(req,res) => {
    server.send({message: `OK!`})
})
server.get(`/messages`,(req,res) => {
    server.send({message: `OK!`})
})
server.post(`/status`,(req,res) => {
    server.send({message: `OK!`})
})













server.listen(5000,() => {
    console.log(`Listening on port 5000`)
})