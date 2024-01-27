const express = require('express');
const app = express();
const port = 3000;
//const Message = require('C:\Users\georg\Documents\GitHub\Podium-Pal\web\message.js');
//const Session = require('C:\Users\georg\Documents\GitHub\Podium-Pal\web\session.js');

app.get('/session/createsession', (req, res) => {
    res.send('Session Page');
    //res.send('Create session');
})

app.get('/session/updatesession', async (req, res) => {
    const {id} = req.params;
    try {
        const existingMessage = await Message.findById(id);
        existingMessage.author = req.body.author || existingMessage.author;
        existingMessage.content = req.body.content || existingMessage.content;
        existingMessage.emotion = req.body.emotion || existingMessage.emotion;
        existingMessage.eye_movement = req.body.eye_movement || existingMessage.eye_movement;
        existingMessage.tone = req.body.tone || existingMessage.tone;

        const updatedMessage =await existingMessage.save();
        if (req.body.sessionId) {
            await Session.updateOne(
                { _id: req.body.sessionId, 'response._id': id },
                { $set: { 'response.$': updatedMessage } }
            );
        }
        res.json(updatedMessage);
    } catch(error) {
        res.status(400).json({message: error.message})
    }
});

app.get('/message', (req, res) => {
    res.send('Message Page');
})
// // Define a simple GET endpoint
// app.get('/', (req, res) => {
//     res.send('Hello, World!');
// });

// // Define an endpoint with a route parameter
// app.get('/user/:username', (req, res) => {
//     const username = req.params.username;
//     res.send(`User: ${username}`);
// });

// // Define an endpoint that accepts POST requests
// app.post('/api/data', (req, res) => {
//     // Handle POST request
//     res.json({ message: 'This is a POST request.' });
// });

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
