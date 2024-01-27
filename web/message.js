const mongoose = require('mongoose');

var messageSchema = new mongoose.Schema({
    author: String,
    content: String,
    emotion: String,
    eye_movement: String,
    tone: String,
});
6
const Message = mongoose.model('Message', messageSchema);
module.exports = Message;