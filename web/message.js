const mongoose = require('mongoose');

var messageSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        default: "",
    },
    author: String,
    content: String,
    emotion: String,
    eye_movement: String,
    tone: String,
});
const Message = mongoose.model('Message', messageSchema);
module.exports = Message;