const express = require('express');
const router = express.Router();

const Message = require('C:\Users\georg\Documents\GitHub\Podium-Pal\web\message.js');

router.get('/messages', async (req, res) => {
    try {
        const messages = await Message.find();
        res.json(messages);
    } catch (error){
        res.status(500).json({message: error.message});
    }
});

router.post('/messages', async (req, res) => {
    const message = new Message({
        author: req.body.author,
        content: req.body.content,
        emotion: req.body.emotion,
        eye_movement: req.body.eye_movement,
        tone: req.body.tone,
    });
    try{
        const newMessage = await message.save();
        res.status(201).json(newMessage);
    } catch (error){
        res.status(400).json({message: error.message});
    }
});

module.exports router