const mongoose = require('mongoose');
const Message = require('./message');

var sessionSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now,
    },
    conversation: {
        type: [Message.schema],
        default: [],
    },
    summary: {
        type: String,
    }
});

const Session = mongoose.model('Session', sessionSchema);
module.exports = Session;