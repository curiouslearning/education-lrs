import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI
const options = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    connectTimeoutMS: 7000,
}


export default function handler(req, res) {
    async function addResults() {
        const client = new MongoClient(uri, options);

        try {
            await client.connect();

            await client.db("assessment").collection("results").insertOne(req.body);

        } catch (e) {
            console.error(e);
        } finally {
            await client.close();
        }

    }

    addResults().catch(console.error);

    res.status(200).json(req.body)
}