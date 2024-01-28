const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const mongoose = require('mongoose');

const app = express();
const port = 3000;

const uri = "mongodb+srv://georgemathew9203:2pP6d3wAimAo1kgy@podiumpalcluster.ufcozb6.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const Message = require('./message');
const Session = require('./message');

app.use(express.json());

app.get('/session/createsession', (req, res) => {
    res.send('Session Page');
});

app.post('/session/update', async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            console.log('no id');
            return res.status(400).json({ message: 'ID Error' });
        }
        const existingMessage = await Message.findById(id);

        console.log('saving');
        const updatedMessage = await existingMessage.save();
        if (req.body.sessionId) {
            await Session.updateOne(
                { _id: req.body.sessionId },
                { $set: { 'response.$': updatedMessage } }
            );
            session.response.push(updatedMessage);
        }
        res.status(200).json(updatedMessage);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.get('/message', (req, res) => {
    res.send('Message Page');
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

async function run() {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        console.log('mongoose connected');

        const newMessage = new Message({
            author: "George",
            content: "Text",
            emotion: "Happy",
            eye_movement: "Moving",
            tone: "Straight",
        });

        console.log('trying to save');
        await newMessage.save();
        console.log('saved');
    } catch {
        console.log('error connecting to MongoDB or saving message');
    } finally {
        await client.close();
    }
}

run().catch(console.dir);
