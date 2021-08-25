import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI
const options = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
}


export default function handler(req, res) {
    async function addResults() {
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const collection = client.db("assessment").collection("results");
        await client.db("assessment").collection("results").insertOne(req.body);
        client.close();

    }
    addResults();
    res.status(200).json(req.body)
}