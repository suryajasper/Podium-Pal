const express = require('express');
const app = express();
const port = 3000;
const Message = require('./message');
const Session = require('./session');
const { connectToMongo, closeMongoConnection } = require('./dbs');


app.use(express.json());

connectToMongo();

app.post('/session/create', async(req,res) => {
    try {
        const session = await Session.create(req.body);
    } catch (error) {
        console.log("Error creating session", error);
        res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
})

app.post('/session/add', async(req, res) => {
    try {
        const message = await Message.create(req.body);
        const session = await Session.findById(req.body.sessionId);
        if (!session)
        {
            return res.status(404).json({error: 'Session not found', message: 'Session id does not exist'});
        }
        session.conversation.push(message);
        await session.save();
        res.status(201).json({ success: true, message: 'Message added to the session' });
    } catch (error) {
        console.log("Error adding message", error);
        res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
})

app.get('/session/aqquire/:sessionId', async(req,res) => {
    try {
        const session = await Session.findById(req.params.sessionId);
        if (!session)
        {
            return res.status(404).json({ message: 'Session not found' });
        }
        res.status(200).json(session);
    } catch (error) {
        console.log("Error aqquiring session", error.message);
        res.status(500).json({message: "Internal server error"});
    }
})


// Start the server
process.on('SIGINT', async () => {
    await closeMongoConnection();
    process.exit(0);
  });

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
